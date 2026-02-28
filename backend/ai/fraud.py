"""
=============================================================
  DIGI TRACEABILITY - Blockchain Food Supply Chain
  Fraud Detection System using Random Forest
  Final Year Project - ML Module
=============================================================
"""
from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI Fraud Detection Running"}


# ─────────────────────────────────────────────
# 1. SYNTHETIC DATASET GENERATION
# ─────────────────────────────────────────────
def generate_dataset(n_samples=1000, fraud_ratio=0.15):
    """Generate a realistic food supply chain dataset with fraud cases."""
    np.random.seed(42)
    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud

    products    = ['Rice', 'Wheat', 'Maize', 'Soybean', 'Palm Oil']
    producers   = [f'Farm_{i}' for i in range(1, 21)]
    locations   = ['Farm', 'Storage', 'Border', 'Distributor', 'Retail']
    statuses    = ['In Transit', 'At Storage', 'Cleared', 'Delivered', 'Held']
    destinations = ['KL_Hub', 'Penang_Hub', 'JB_Hub', 'Sabah_Hub', 'Sarawak_Hub']

    def make_record(is_fraud=False):
        prod_date  = datetime.now() - timedelta(days=np.random.randint(1, 180))
        expiry_date = prod_date + timedelta(days=np.random.randint(30, 730))
        timestamp  = prod_date + timedelta(hours=np.random.randint(1, 2000))

        record = {
            'Batch_ID'             : f'BATCH-{np.random.randint(1000, 9999):04d}',
            'Product_Name'         : np.random.choice(products),
            'Producer_Name'        : np.random.choice(producers),
            'Quantity'             : np.random.randint(100, 1000),
            'Production_Date'      : prod_date,
            'Expiry_Date'          : expiry_date,
            'Current_Status'       : np.random.choice(statuses),
            'Last_Location'        : np.random.choice(locations),
            'Expected_Destination' : np.random.choice(destinations),
            'Timestamp'            : timestamp,
            'Checkpoint_Count'     : np.random.randint(2, 10),
            'Transport_Time'       : np.random.uniform(1, 72),   # hours
            'Price'                : np.random.uniform(50, 500),
            'Distributor_ID'       : f'DIST-{np.random.randint(1, 50):02d}',
            'Is_Fraud'             : 0,
            'Fraud_Type'           : 'None',
        }

        if is_fraud:
            fraud_type = np.random.choice([
                'Long_Storage', 'Wrong_Route', 'Duplicate_Entry',
                'Hoarding', 'Missing_Shipment', 'Expired_Goods',
                'Bulk_Purchase'
            ])
            record['Fraud_Type'] = fraud_type

            if fraud_type == 'Long_Storage':
                record['Transport_Time']  = np.random.uniform(200, 800)
                record['Checkpoint_Count'] = np.random.randint(1, 3)

            elif fraud_type == 'Wrong_Route':
                record['Last_Location']        = np.random.choice(['Border', 'Unknown'])
                record['Expected_Destination'] = np.random.choice(destinations)

            elif fraud_type == 'Duplicate_Entry':
                record['Batch_ID']         = 'BATCH-9999'
                record['Checkpoint_Count'] = np.random.randint(8, 20)

            elif fraud_type == 'Hoarding':
                record['Quantity']         = np.random.randint(5000, 20000)
                record['Distributor_ID']   = 'DIST-01'

            elif fraud_type == 'Missing_Shipment':
                record['Transport_Time']   = np.random.uniform(500, 2000)
                record['Checkpoint_Count'] = 0

            elif fraud_type == 'Expired_Goods':
                record['Expiry_Date']      = prod_date - timedelta(days=np.random.randint(1, 60))
                record['Current_Status']   = 'In Transit'

            elif fraud_type == 'Bulk_Purchase':
                record['Quantity'] = np.random.randint(8000, 50000)
                record['Price']    = record['Price'] * 0.3

            record['Is_Fraud'] = 1

        return record

    legit_records = [make_record(False) for _ in range(n_legit)]
    fraud_records = [make_record(True)  for _ in range(n_fraud)]
    df = pd.DataFrame(legit_records + fraud_records).sample(frac=1, random_state=42).reset_index(drop=True)
    return df


# ─────────────────────────────────────────────
# 2. FEATURE ENGINEERING
# ─────────────────────────────────────────────
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create ML-ready features from raw supply chain data.
    These features capture the 7 fraud types defined in the project.
    """
    df = df.copy()
    now = pd.Timestamp.now()

    # ── Date helpers ──────────────────────────────────────
    df['Production_Date'] = pd.to_datetime(df['Production_Date'], errors='coerce')
    df['Expiry_Date']     = pd.to_datetime(df['Expiry_Date'], errors='coerce')
    df['Timestamp']       = pd.to_datetime(df['Timestamp'], errors='coerce')

    # Fill missing dates with sensible defaults for API input
    df['Production_Date'] = df['Production_Date'].fillna(now - timedelta(days=30))
    df['Expiry_Date']     = df['Expiry_Date'].fillna(now + timedelta(days=365))
    df['Timestamp']       = df['Timestamp'].fillna(now)

    # ── Feature 1 – Days until expiry at time of checkpoint ──
    df['Days_Until_Expiry']     = (df['Expiry_Date'] - df['Timestamp']).dt.days
    df['Days_Since_Production'] = (df['Timestamp'] - df['Production_Date']).dt.days

    # ── Feature 2 – Shelf life consumed (%) ──────────────
    total_shelf = (df['Expiry_Date'] - df['Production_Date']).dt.days.replace(0, 1)
    df['Shelf_Life_Consumed_Pct'] = (
        (df['Timestamp'] - df['Production_Date']).dt.days / total_shelf * 100
    ).clip(0, 200)

    # ── Feature 3 – Is already expired? ──────────────────
    df['Is_Expired'] = (df['Days_Until_Expiry'] < 0).astype(int)

    # ── Feature 4 – Transport time anomaly (Z-score) ─────
    mean_tt = df['Transport_Time'].mean()
    std_tt  = df['Transport_Time'].std() + 1e-9
    df['Transport_Time_Zscore'] = (df['Transport_Time'] - mean_tt) / std_tt

    # ── Feature 5 – Quantity anomaly ─────────────────────
    mean_q = df['Quantity'].mean()
    std_q  = df['Quantity'].std() + 1e-9
    df['Quantity_Zscore'] = (df['Quantity'] - mean_q) / std_q

    # ── Feature 6 – Price per unit ───────────────────────
    df['Price_Per_Unit'] = df['Price'] / df['Quantity'].replace(0, 1)

    # ── Feature 7 – Low checkpoint density (missing updates) ──
    df['Checkpoint_Density'] = df['Checkpoint_Count'] / (df['Transport_Time'].replace(0, 1))
    df['No_Checkpoint']      = (df['Checkpoint_Count'] == 0).astype(int)

    # ── Feature 8 – Duplicate batch detection ────────────
    if 'Batch_ID' in df.columns:
        batch_counts              = df.groupby('Batch_ID')['Batch_ID'].transform('count')
        df['Batch_Duplicate_Count'] = batch_counts
        df['Is_Duplicate']         = (batch_counts > 1).astype(int)
    else:
        df['Batch_Duplicate_Count'] = 1
        df['Is_Duplicate']          = 0

    # ── Feature 9 – Distributor hoarding score ───────────
    if 'Distributor_ID' in df.columns:
        dist_qty = df.groupby('Distributor_ID')['Quantity'].transform('sum')
        df['Distributor_Total_Qty'] = dist_qty
    else:
        df['Distributor_Total_Qty'] = df['Quantity']
    mean_dq  = df['Distributor_Total_Qty'].mean()
    std_dq   = df['Distributor_Total_Qty'].std() + 1e-9
    df['Distributor_Qty_Zscore'] = (df['Distributor_Total_Qty'] - mean_dq) / std_dq

    # ── Feature 10 – Location encoding ───────────────────
    location_order = {'Farm': 0, 'Storage': 1, 'Border': 2, 'Distributor': 3, 'Retail': 4}
    df['Location_Code'] = df['Last_Location'].map(location_order).fillna(-1) if 'Last_Location' in df.columns else -1

    # ── Feature 11 – Status encoding ─────────────────────
    status_risk = {'Delivered': 0, 'Cleared': 1, 'In Transit': 2, 'At Storage': 3, 'Held': 4}
    df['Status_Risk_Code'] = df['Current_Status'].map(status_risk).fillna(2) if 'Current_Status' in df.columns else 2

    # ── Feature 12 – Hour of day (unusual shipment times) ─
    df['Hour_Of_Day'] = df['Timestamp'].dt.hour

    # ── Feature 13 – Long storage flag ───────────────────
    df['Long_Storage_Flag'] = (
        (df['Transport_Time'] > 168) &
        (df['Checkpoint_Count'] < 3)
    ).astype(int)

    # ── Feature 14 – Bulk purchase flag ──────────────────
    q95 = df['Quantity'].quantile(0.95)
    df['Bulk_Purchase_Flag'] = (df['Quantity'] > q95).astype(int)

    return df


# ─────────────────────────────────────────────
# 3. MODEL TRAINING
# ─────────────────────────────────────────────
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score, f1_score
import joblib

# ── Feature columns used for training ────────
FEATURE_COLS = [
    'Quantity', 'Transport_Time', 'Checkpoint_Count', 'Price',
    'Days_Until_Expiry', 'Days_Since_Production', 'Shelf_Life_Consumed_Pct',
    'Is_Expired', 'Transport_Time_Zscore', 'Quantity_Zscore',
    'Price_Per_Unit', 'Checkpoint_Density', 'No_Checkpoint',
    'Batch_Duplicate_Count', 'Is_Duplicate', 'Distributor_Total_Qty',
    'Distributor_Qty_Zscore', 'Location_Code', 'Status_Risk_Code',
    'Hour_Of_Day', 'Long_Storage_Flag', 'Bulk_Purchase_Flag',
]

def train_model(df: pd.DataFrame):
    """Train Random Forest fraud detection model."""
    df_feat = engineer_features(df)
    X = df_feat[FEATURE_COLS].fillna(0)
    y = df_feat['Is_Fraud']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    # ── Evaluation ────────────────────────────────────────
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\n" + "="*60)
    print("  DIGI TRACEABILITY - Model Evaluation Report")
    print("="*60)
    print(classification_report(y_test, y_pred, target_names=['Legit', 'Fraud']))
    print(f"  ROC-AUC Score : {roc_auc_score(y_test, y_prob):.4f}")
    print(f"  F1 Score      : {f1_score(y_test, y_pred):.4f}")
    print("="*60)

    # ── Cross-validation ─────────────────────────────────
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc')
    print(f"\n  5-Fold CV AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── Feature importance ───────────────────────────────
    fi = pd.Series(model.feature_importances_, index=FEATURE_COLS).sort_values(ascending=False)
    print("\n  Top 10 Feature Importances:")
    print(fi.head(10).to_string())

    # Save model
    joblib.dump(model, 'fraud_model.pkl')
    print("\n  ✅ Model saved → fraud_model.pkl")

    return model, X_test, y_test


# ─────────────────────────────────────────────
# MODEL LOADING (runs at FastAPI startup)
# ─────────────────────────────────────────────
try:
    model = joblib.load("fraud_model.pkl")
    print("✅ Model loaded from fraud_model.pkl")
except Exception:
    print("⚠️  No saved model found. Training a new model...")
    df = generate_dataset(1200, 0.15)
    model, _, _ = train_model(df)


# ─────────────────────────────────────────────
# /predict  ENDPOINT
# ─────────────────────────────────────────────
class PredictionInput(BaseModel):
    Quantity: float
    Transport_Time: float
    Checkpoint_Count: int
    Price: float
    # Optional fields — defaults reflect a normal, low-risk shipment
    Production_Date: str = ""
    Expiry_Date: str = ""
    Timestamp: str = ""
    Current_Status: str = "In Transit"
    Last_Location: str = "Farm"
    Batch_ID: str = "BATCH-0000"
    Distributor_ID: str = "DIST-01"


@app.post("/predict")
def predict(data: PredictionInput):
    """
    Accepts a supply chain checkpoint record and returns
    a fraud probability + alert level.

    Minimal required fields: Quantity, Transport_Time,
    Checkpoint_Count, Price.

    Example body:
    {
        "Quantity": 9000,
        "Transport_Time": 500,
        "Checkpoint_Count": 0,
        "Price": 50
    }
    """
    now = datetime.now()

    # Build a one-row DataFrame from the request
    input_df = pd.DataFrame([{
        "Batch_ID"            : data.Batch_ID,
        "Quantity"            : data.Quantity,
        "Transport_Time"      : data.Transport_Time,
        "Checkpoint_Count"    : data.Checkpoint_Count,
        "Price"               : data.Price,
        "Production_Date"     : data.Production_Date or (now - timedelta(days=30)).isoformat(),
        "Expiry_Date"         : data.Expiry_Date      or (now + timedelta(days=365)).isoformat(),
        "Timestamp"           : data.Timestamp        or now.isoformat(),
        "Current_Status"      : data.Current_Status,
        "Last_Location"       : data.Last_Location,
        "Distributor_ID"      : data.Distributor_ID,
    }])

    # Ensure required columns exist
    required_cols = [
        "Batch_ID", "Product_Name", "Producer_Name", "Expected_Destination"
    ]
    for col in required_cols:
        if col not in input_df:
            input_df[col] = "Unknown"

    # Feature engineering + prediction
    df_features = engineer_features(input_df)
    X = df_features[FEATURE_COLS].fillna(0)

    try:
        prediction  = int(model.predict(X)[0])
        probability = float(model.predict_proba(X)[0][1])
    except Exception:
        prediction  = 0
        probability = 0.0

    # Alert level
    alert_level = get_alert_level(probability)

    # Rule-based fraud type flags
    fraud_types = detect_fraud_type(df_features.iloc[0]) if prediction == 1 else ["None"]

    return {
        "fraud_prediction" : prediction,
        "fraud_probability": round(probability, 4),
        "alert_level"      : alert_level,
        "fraud_types"      : fraud_types,
    }


# ─────────────────────────────────────────────
# 4. FRAUD DETECTION ENGINE
# ─────────────────────────────────────────────
FRAUD_THRESHOLDS = {
    'Long_Storage'    : 168,    # hours (7 days)
    'Missing_Shipment': 48,     # hours without checkpoint
    'Hoarding_Qty'    : 5000,   # units
    'Bulk_Zscore'     : 3.0,    # standard deviations
}

ALERT_LEVELS = {
    0.3: 'LOW',
    0.6: 'MEDIUM',
    0.8: 'HIGH',
    1.0: 'CRITICAL',
}

def get_alert_level(prob: float) -> str:
    for threshold, level in ALERT_LEVELS.items():
        if prob <= threshold:
            return level
    return 'CRITICAL'


def detect_fraud_type(row: pd.Series) -> list:
    """Rule-based fraud type labelling (complements ML probability)."""
    flags = []

    if row.get('Is_Expired', 0) == 1 and row.get('Status_Risk_Code', 0) >= 2:
        flags.append('EXPIRED_GOODS_IN_TRANSIT')

    if row.get('Transport_Time', 0) > FRAUD_THRESHOLDS['Long_Storage'] \
       and row.get('Checkpoint_Count', 99) < 3:
        flags.append('LONG_STORAGE_ANOMALY')

    if row.get('No_Checkpoint', 0) == 1:
        flags.append('MISSING_SHIPMENT')

    if row.get('Is_Duplicate', 0) == 1:
        flags.append('DUPLICATE_BATCH_ID')

    if row.get('Quantity_Zscore', 0) > FRAUD_THRESHOLDS['Bulk_Zscore']:
        if row.get('Price_Per_Unit', 999) < row.get('Price', 999) * 0.4:
            flags.append('SUSPICIOUS_BULK_PURCHASE')
        else:
            flags.append('HOARDING')

    return flags if flags else ['ML_DETECTED_ANOMALY']


def run_fraud_detection(new_records: pd.DataFrame, model) -> pd.DataFrame:
    """
    Main inference pipeline.
    Accepts raw supply chain records, returns enriched alert DataFrame.
    """
    df_feat = engineer_features(new_records)
    X_new   = df_feat[FEATURE_COLS].fillna(0)

    probs = model.predict_proba(X_new)[:, 1]
    preds = model.predict(X_new)

    results = new_records.copy().reset_index(drop=True)
    results['Fraud_Probability']  = probs
    results['Is_Fraud_Predicted'] = preds
    results['Alert_Level']  = [get_alert_level(p) for p in probs]
    results['Fraud_Types']  = [
        ', '.join(detect_fraud_type(df_feat.iloc[i])) if preds[i] == 1 else 'None'
        for i in range(len(preds))
    ]
    results['Alert_Time'] = datetime.now().isoformat()

    return results


# ─────────────────────────────────────────────
# 5. ALERT OUTPUT SYSTEM
# ─────────────────────────────────────────────
def output_alerts(results: pd.DataFrame) -> None:
    """Print formatted alerts for flagged records."""
    flagged = results[results['Is_Fraud_Predicted'] == 1].copy()
    flagged = flagged.sort_values('Fraud_Probability', ascending=False)

    print("\n" + "="*65)
    print("  🚨  DIGI TRACEABILITY - FRAUD ALERT REPORT")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*65)

    if flagged.empty:
        print("  ✅  No fraud detected in this batch.")
        return

    print(f"  Total Records Scanned : {len(results)}")
    print(f"  Fraud Cases Detected  : {len(flagged)}")
    print(f"  Fraud Rate            : {len(flagged)/len(results)*100:.1f}%\n")

    level_icons = {'LOW': '🟡', 'MEDIUM': '🟠', 'HIGH': '🔴', 'CRITICAL': '🆘'}

    for _, row in flagged.iterrows():
        icon = level_icons.get(row['Alert_Level'], '🔴')
        print(f"  {icon} [{row['Alert_Level']}] Batch: {row['Batch_ID']}")
        print(f"     Product     : {row['Product_Name']}  |  Producer: {row['Producer_Name']}")
        print(f"     Quantity    : {row['Quantity']} units  |  Distributor: {row['Distributor_ID']}")
        print(f"     Location    : {row['Last_Location']}  →  {row['Expected_Destination']}")
        print(f"     Fraud Score : {row['Fraud_Probability']:.3f}")
        print(f"     Fraud Types : {row['Fraud_Types']}")
        print(f"     Timestamp   : {row['Timestamp']}")
        print("  " + "-"*62)

    print("\n  📊 Alert Summary by Fraud Type:")
    all_types = []
    for t in flagged['Fraud_Types']:
        all_types.extend([x.strip() for x in t.split(',')])
    for ftype, count in pd.Series(all_types).value_counts().items():
        print(f"     {ftype:40s}: {count}")
    print("="*65)


def export_alerts_to_json(results: pd.DataFrame, path='alerts_output.json') -> None:
    """Export alerts as JSON — ready for blockchain API consumption."""
    flagged = results[results['Is_Fraud_Predicted'] == 1].copy()

    alerts = []
    for _, row in flagged.iterrows():
        alerts.append({
            'batch_id'         : row['Batch_ID'],
            'product'          : row['Product_Name'],
            'producer'         : row['Producer_Name'],
            'distributor_id'   : row['Distributor_ID'],
            'quantity'         : int(row['Quantity']),
            'last_location'    : row['Last_Location'],
            'destination'      : row['Expected_Destination'],
            'fraud_probability': round(float(row['Fraud_Probability']), 4),
            'alert_level'      : row['Alert_Level'],
            'fraud_types'      : row['Fraud_Types'].split(', '),
            'alert_timestamp'  : row['Alert_Time'],
        })

    import json
    with open(path, 'w') as f:
        json.dump({'total_alerts': len(alerts), 'alerts': alerts}, f, indent=2)

    print(f"\n  📁 Alerts exported → {path}")


# ─────────────────────────────────────────────
# 6. BLOCKCHAIN INTEGRATION LAYER
# ─────────────────────────────────────────────
"""
BLOCKCHAIN INTEGRATION STRATEGY
═══════════════════════════════════════════════════════════════

Architecture:
┌────────────────────────────────────────────────────────────┐
│  Mobile App (React Native / Expo)                          │
│   - Farmer scans QR → POST to REST API                     │
│   - Checkpoint scan  → POST to REST API                    │
└────────────────────┬───────────────────────────────────────┘
                     │ HTTP/JSON
┌────────────────────▼───────────────────────────────────────┐
│  Backend API  (Node.js / FastAPI)                          │
│   - Records checkpoint to blockchain ledger                │
│   - Triggers ML inference on each new record               │
│   - Pushes alerts to dashboard / government portal         │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│  Blockchain (Hyperledger Fabric / Ethereum)                │
│   - Immutable record of every checkpoint event             │
│   - Smart contract validates: expiry, route, quantity      │
│   - ML alert hashes stored on-chain for audit trail        │
└────────────────────────────────────────────────────────────┘

Integration Steps:
  1.  Every checkpoint scan → blockchain transaction recorded
  2.  ML model receives the new record via API trigger
  3.  If fraud_probability > 0.5 → alert raised
  4.  Alert hash (SHA-256) stored on blockchain for immutability
  5.  Government / NGO dashboard polls alerts endpoint
  6.  Smart contract can auto-freeze a batch if CRITICAL alert raised
"""

def simulate_blockchain_api_call(alert: dict) -> dict:
    """
    Simulates storing an ML fraud alert hash on-chain.
    In production: replace with web3.py / fabric-sdk call.
    """
    import hashlib, json
    alert_str  = json.dumps(alert, sort_keys=True)
    alert_hash = hashlib.sha256(alert_str.encode()).hexdigest()

    tx_record = {
        'tx_hash'    : f'0x{alert_hash[:40]}',
        'batch_id'   : alert['batch_id'],
        'alert_level': alert['alert_level'],
        'fraud_types': alert['fraud_types'],
        'block_number': np.random.randint(100000, 999999),
        'timestamp'  : datetime.now().isoformat(),
        'status'     : 'CONFIRMED',
    }
    return tx_record


# ─────────────────────────────────────────────
# 7. MAIN — DEMO RUN
# ─────────────────────────────────────────────
if __name__ == '__main__':

    print("\n🌿  DIGI TRACEABILITY - Fraud Detection System Starting...\n")

    # Step 1: Generate data
    print("📦 Generating synthetic supply chain dataset...")
    df = generate_dataset(n_samples=1200, fraud_ratio=0.15)
    print(f"   Dataset shape: {df.shape}  |  Fraud cases: {df['Is_Fraud'].sum()}\n")

    # Step 2: Train model
    print("🤖 Training Random Forest model...")
    model, X_test, y_test = train_model(df)

    # Step 3: Simulate incoming checkpoint records (new unseen data)
    print("\n🔍 Running fraud detection on new checkpoint records...")
    new_data = generate_dataset(n_samples=50, fraud_ratio=0.20)
    results  = run_fraud_detection(new_data, model)

    # Step 4: Output alerts
    output_alerts(results)

    # Step 5: Export JSON alerts (for blockchain API)
    export_alerts_to_json(results, 'alerts_output.json')

    # Step 6: Simulate blockchain recording of alerts
    flagged = results[results['Is_Fraud_Predicted'] == 1]
    print("\n⛓️  Simulating Blockchain Alert Storage:")
    for _, row in flagged.head(3).iterrows():
        alert = {
            'batch_id'    : row['Batch_ID'],
            'alert_level' : row['Alert_Level'],
            'fraud_types' : row['Fraud_Types'].split(', '),
        }
        tx = simulate_blockchain_api_call(alert)
        print(f"   TX Hash: {tx['tx_hash']}  |  Block: {tx['block_number']}  |  Status: {tx['status']}")

    print("\n✅  Digi Traceability ML Pipeline Complete.\n")