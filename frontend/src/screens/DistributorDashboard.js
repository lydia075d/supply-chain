import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Alert, ActivityIndicator, Dimensions, TextInput,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

const DistributorDashboard = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner]   = useState(false);
  const [scanning, setScanning]         = useState(false);
  const [recentScans, setRecentScans]   = useState([]);
  const [stats, setStats]               = useState({ todayScans: 0, totalScans: 0, anomalies: 0 });
  const [loadingScans, setLoadingScans] = useState(false);

  const [showDispatch, setShowDispatch]       = useState(false);
  const [dispatchBatchId, setDispatchBatchId] = useState('');
  const [splits, setSplits]                   = useState([
    { retailerEmail: '', retailerName: '', quantity: '' },
  ]);
  const [dispatching, setDispatching]         = useState(false);

  useEffect(() => { loadRecentScans(); }, []);

  const loadRecentScans = async () => {
    setLoadingScans(true);
    try {
      const data = await ApiService.getDistributorCheckpoints();
      setRecentScans(data);
      const today    = new Date().toDateString();
      const todayCount = data.filter(s => new Date(s.timestamp).toDateString() === today).length;
      setStats({
        todayScans: todayCount,
        totalScans: data.length,
        anomalies : data.filter(s => s.anomaly).length,
      });
    } catch (error) {
      console.error('[Distributor] Failed to load scans:', error.message);
      setRecentScans([]);
    } finally {
      setLoadingScans(false);
    }
  };

  const handleBarCodeRead = async ({ data }) => {
    if (scanning) return;
    setScanning(true);
    let batchId;
    try {
      const batchData = JSON.parse(data);
      batchId = batchData.batchId;
      if (!batchId) {
        Alert.alert('Invalid QR Code', `Missing batchId.\n\nData: ${JSON.stringify(batchData, null, 2)}`);
        setScanning(false); setShowScanner(false); return;
      }
    } catch {
      Alert.alert('Invalid QR Code', `Expected JSON but got:\n\n"${data}"`);
      setScanning(false); setShowScanner(false); return;
    }
    let location;
    try   { location = await getCurrentLocation(); }
    catch (e) { Alert.alert('Location Error', e.message); setScanning(false); setShowScanner(false); return; }
    try {
      await recordCheckpoint(batchId, location);
      setShowScanner(false);
      loadRecentScans();
    } catch (e) {
      Alert.alert('Failed to Record Checkpoint', e.message);
      setShowScanner(false);
    } finally { setScanning(false); }
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
  };

  const recordCheckpoint = async (batchId, location) => {
    const result = await ApiService.recordCheckpoint({
      batchId, location, timestamp: new Date().toISOString(), scannerRole: 'distributor',
    });
    if (result.anomalyDetected) {
      Alert.alert('⚠️ Anomaly Detected', `${result.anomalyType}\n\n${result.anomalyDetails}`, [{ text: 'OK' }]);
    } else {
      Alert.alert('✅ Success', 'Checkpoint recorded!', [{ text: 'OK' }]);
    }
  };
 
  const addSplit = () => {
    setSplits(prev => [...prev, { retailerEmail: '', retailerName: '', quantity: '' }]);
  };

  const removeSplit = (index) => {
    setSplits(prev => prev.filter((_, i) => i !== index));
  };

  const updateSplit = (index, field, value) => {
    setSplits(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleDispatch = async () => {
    if (!dispatchBatchId.trim()) {
      Alert.alert('Error', 'Please enter a Batch ID'); return;
    }
    for (const s of splits) {
      if (!s.retailerEmail.trim() || !s.quantity) {
        Alert.alert('Error', 'Fill in retailer email and quantity for each split'); return;
      }
    }
    setDispatching(true);
    try {
      const location = await getCurrentLocation();
          console.log('[Dispatch] Raw location:', JSON.stringify(location));

      const payload  = {
        parentBatchId: dispatchBatchId.trim(),
        splits: splits.map(s => ({
          retailerEmail   : s.retailerEmail.trim(),
          retailerName    : s.retailerName.trim() || 'Retailer',
          quantity        : Number(s.quantity),
          location: {                               
      latitude : location.latitude,
      longitude: location.longitude,
      accuracy : location.accuracy,
    },
        })),
      };
          console.log('[Dispatch] Payload:', JSON.stringify(payload));

          
      await ApiService.dispatchToRetailers(payload);
      Alert.alert('✅ Dispatched', `Batch split to ${splits.length} retailer(s) successfully.`);
      setShowDispatch(false);
      setSplits([{ retailerEmail: '', retailerName: '', quantity: '' }]);
      setDispatchBatchId('');
      loadRecentScans();
    } catch (err) {
      Alert.alert('Dispatch Failed', err.message);
    } finally {
      setDispatching(false);
    }
  };
 

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={32} color={color} />
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderScanCard = (scan) => {
    const timeAgo = getTimeAgo(scan.timestamp);
    return (
      <View key={`${scan.batchId}-${scan.timestamp}`}
        style={[styles.scanCard, scan.anomaly && styles.scanCardAnomaly]}>
        <View style={styles.scanHeader}>
          <Text style={styles.scanBatchId}>{scan.batchId}</Text>
          {scan.anomaly && (
            <View style={styles.anomalyBadge}>
              <Icon name="warning" size={16} color="#fff" />
              <Text style={styles.anomalyText}>ANOMALY</Text>
            </View>
          )}
        </View>
        <View style={styles.scanInfo}>
          <View style={styles.scanRow}><Icon name="category" size={16} color="#666" /><Text style={styles.scanText}>{scan.productType}</Text></View>
          <View style={styles.scanRow}><Icon name="location-on" size={16} color="#666" /><Text style={styles.scanText}>{scan.location}</Text></View>
          <View style={styles.scanRow}><Icon name="access-time" size={16} color="#666" /><Text style={styles.scanText}>{timeAgo}</Text></View>
        </View>
      </View>
    );
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header — original, unchanged */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Distributor Dashboard</Text>
          <Text style={styles.headerSubtitle}>Scan and track batches</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.statsContainer}>
          {renderStatCard("Today's Scans", stats.todayScans, 'today', '#2196F3')}
          {renderStatCard('Total Scans', stats.totalScans, 'qr-code-scanner', '#4CAF50')}
          {renderStatCard('Anomalies', stats.anomalies, 'warning', '#F44336')}
        </View>

        {/* Original scan button — unchanged */}
        <TouchableOpacity style={styles.scanButton} onPress={async () => {
          if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) { Alert.alert('Camera Permission Required', 'Please allow camera access.'); return; }
          }
          setShowScanner(true);
        }}>
          <Icon name="qr-code-scanner" size={32} color="#fff" />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

        {/* NEW — Dispatch to Retailer button */}
        <TouchableOpacity style={styles.dispatchButton} onPress={() => setShowDispatch(true)}>
          <Icon name="local-shipping" size={28} color="#fff" />
          <Text style={styles.scanButtonText}>Dispatch to Retailer</Text>
        </TouchableOpacity>
        {/* END NEW */}

        <View style={styles.recentScansContainer}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          {loadingScans ? (
            <ActivityIndicator size="large" color="#366d80ff" style={{ marginTop: 40 }} />
          ) : recentScans.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="qr-code-scanner" size={80} color="#ddd" />
              <Text style={styles.emptyText}>No scans yet</Text>
              <Text style={styles.emptySubtext}>Tap the scan button to record your first checkpoint</Text>
            </View>
          ) : (
            recentScans.map(renderScanCard)
          )}
        </View>
      </ScrollView>

      {/* Original QR scanner modal — unchanged */}
      <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.closeButton}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.cameraWrapper}>
            <CameraView style={StyleSheet.absoluteFillObject} facing="back"
              onBarcodeScanned={scanning ? undefined : handleBarCodeRead}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }} />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerBox}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.scannerInstructions}>
                {scanning ? 'Processing...' : 'Align QR code within the frame'}
              </Text>
              {scanning && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />}
            </View>
          </View>
        </View>
      </Modal>

      {/* NEW — Dispatch to Retailer Modal */}
      <Modal visible={showDispatch} animationType="slide" onRequestClose={() => setShowDispatch(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDispatch(false)}>
              <Icon name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Dispatch to Retailers</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Parent Batch ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BATCH-1234567890-ABC"
              value={dispatchBatchId}
              onChangeText={setDispatchBatchId}
              autoCapitalize="characters"
            />

            <Text style={styles.sectionTitle}>Retailer Splits</Text>

            {splits.map((split, index) => (
              <View key={index} style={styles.splitCard}>
                <View style={styles.splitCardHeader}>
                  <Text style={styles.splitTitle}>Retailer {index + 1}</Text>
                  {splits.length > 1 && (
                    <TouchableOpacity onPress={() => removeSplit(index)}>
                      <Icon name="remove-circle" size={24} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Retailer Email"
                  value={split.retailerEmail}
                  onChangeText={v => updateSplit(index, 'retailerEmail', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Retailer Name (optional)"
                  value={split.retailerName}
                  onChangeText={v => updateSplit(index, 'retailerName', v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Quantity (units)"
                  value={split.quantity}
                  onChangeText={v => updateSplit(index, 'quantity', v)}
                  keyboardType="numeric"
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addSplitButton} onPress={addSplit}>
              <Icon name="add-circle" size={22} color="#366d80ff" />
              <Text style={styles.addSplitText}>Add Another Retailer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scanButton, { marginHorizontal: 0, marginBottom: 40 }]}
              onPress={handleDispatch}
              disabled={dispatching}>
              {dispatching
                ? <ActivityIndicator color="#fff" />
                : <><Icon name="local-shipping" size={24} color="#fff" /><Text style={styles.scanButtonText}>Confirm Dispatch</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      {/* END NEW */}
    </View>
  );
};

const styles = StyleSheet.create({
  container          : { flex: 1, backgroundColor: '#f5f5f5' },
  header             : { backgroundColor: '#366d80ff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle        : { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle     : { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  logoutButton       : { padding: 8 },
  statsContainer     : { padding: 16, gap: 12 },
  statCard           : { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderLeftWidth: 4, alignItems: 'center', elevation: 2 },
  statInfo           : { marginLeft: 16 },
  statValue          : { fontSize: 28, fontWeight: 'bold', color: '#333' },
  statTitle          : { fontSize: 14, color: '#666', marginTop: 4 },
  scanButton         : { backgroundColor: '#366d80ff', marginHorizontal: 16, marginVertical: 8, padding: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 4 },
  scanButtonText     : { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  recentScansContainer: { padding: 16 },
  sectionTitle       : { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  scanCard           : { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  scanCardAnomaly    : { borderWidth: 2, borderColor: '#F44336' },
  scanHeader         : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scanBatchId        : { fontSize: 18, fontWeight: 'bold', color: '#366d80ff' },
  anomalyBadge       : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F44336', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
  anomalyText        : { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  scanInfo           : { gap: 8 },
  scanRow            : { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scanText           : { fontSize: 14, color: '#666' },
  emptyState         : { alignItems: 'center', paddingVertical: 60 },
  emptyText          : { fontSize: 18, color: '#999', marginTop: 16 },
  emptySubtext       : { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  scannerContainer   : { flex: 1, backgroundColor: '#000' },
  scannerHeader      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.7)' },
  closeButton        : { padding: 8 },
  scannerTitle       : { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  cameraWrapper      : { flex: 1 },
  scannerOverlay     : { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scannerBox         : { width: width * 0.7, height: width * 0.7, position: 'relative' },
  corner             : { position: 'absolute', width: 40, height: 40, borderColor: '#366d80ff' },
  cornerTopLeft      : { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTopRight     : { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBottomLeft   : { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBottomRight  : { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scannerInstructions: { color: '#fff', fontSize: 16, marginTop: 30, textAlign: 'center' },

  // ── NEW styles ─────────────────────────────────────────
  dispatchButton  : { backgroundColor: '#FF9800', marginHorizontal: 16, marginVertical: 8, padding: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 4 },
  modalContainer  : { flex: 1, backgroundColor: '#f5f5f5' },
  modalHeader     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', elevation: 2 },
  modalTitle      : { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalBody       : { padding: 16 },
  inputLabel      : { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input           : { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  splitCard       : { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  splitCardHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  splitTitle      : { fontSize: 16, fontWeight: 'bold', color: '#333' },
  addSplitButton  : { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, marginBottom: 16 },
  addSplitText    : { fontSize: 16, color: '#366d80ff', fontWeight: '600' },
});

export default DistributorDashboard;