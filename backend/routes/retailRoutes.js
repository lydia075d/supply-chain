const express     = require('express');
const router      = express.Router();
const Batch       = require('../models/Batch');
const RetailBatch = require('../models/RetailBatch');
const Checkpoint  = require('../models/Checkpoint');
const Alert       = require('../models/Alert');
const auth        = require('../middleware/authMiddleware');
const axios       = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

router.post('/dispatch', auth, async (req, res) => {
  try {
    const { parentBatchId, splits } = req.body;

    if (!parentBatchId || !splits || splits.length === 0) {
      return res.status(400).json({ error: 'parentBatchId and splits[] required' });
    }

    const parentBatch = await Batch.findOne({ batchId: parentBatchId });
    if (!parentBatch) {
      return res.status(404).json({ error: `Batch not found: ${parentBatchId}` });
    }

    const totalSplit = splits.reduce((sum, s) => sum + Number(s.quantity), 0);

    const originalQty = Number(parentBatch.originalQuantity || parentBatch.quantity);

    const alreadyUsed = await RetailBatch.aggregate([
      {
        $match: {
          parentBatchId,
          status: { $ne: 'Deleted' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantityReceived" }
        }
      }
    ]);

    const used = alreadyUsed[0]?.total || 0;
    const available = originalQty - used;

    console.log(`[Dispatch] originalQty=${originalQty}, used=${used}, available=${available}, requested=${totalSplit}`);

    if (totalSplit > available) {
      return res.status(400).json({
        error: `Not enough stock. Available: ${available}, Requested: ${totalSplit}`
      });
    }

    const created = [];

for (const split of splits) {
  const retailBatchId = `RB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const loc = split.location || null; // ✅ guard once, reuse everywhere

  const rb = await RetailBatch.create({
    retailBatchId,
    parentBatchId,

    retailerEmail:     split.retailerEmail?.trim().toLowerCase(),
    quantityReceived:  Number(split.quantity),
    quantityRemaining: Number(split.quantity),

    productType:  parentBatch.productType,
    expiryDate:   parentBatch.expiryDate,
    status:       'Dispatched',
    dispatchedAt: new Date(),

    retailerLocation: loc
      ? `${loc.latitude},${loc.longitude}`
      : 'Unknown',

    location: {
      latitude:  loc?.latitude  ?? null,  // ✅ safe even if loc is null
      longitude: loc?.longitude ?? null,
    },
  });

  created.push(rb);
}

    await Batch.updateOne(
      { batchId: parentBatchId },
      {
        $set: {
          quantity: available - totalSplit,
          status: 'Dispatched to Retail'
        }
      }
    );

    res.json({ success: true, dispatched: created });

  } catch (err) {
    console.error('[Retail] Dispatch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/soft-delete/:retailBatchId', auth, async (req, res) => {
  try {
    await RetailBatch.updateOne(
      { retailBatchId: req.params.retailBatchId },
      { $set: { status: 'Deleted' } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:retailBatchId/receive', auth, async (req, res) => {
  try {
    const { location } = req.body;

    const rb = await RetailBatch.findOne({
      retailBatchId: req.params.retailBatchId
    });

    if (!rb) return res.status(404).json({ error: 'Retail batch not found' });

    rb.status = 'Received';
    rb.receivedAt = new Date();

    if (location) rb.location = location;

    await rb.save();

    await new Checkpoint({
      batchId: rb.parentBatchId,
      location: {
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
      },
      timestamp: new Date(),
      scannerRole: 'retailer',
    }).save();

    runRetailFraudCheck(rb);

    res.json({
      success: true,
      retailBatchId: rb.retailBatchId,
      status: rb.status
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.patch('/:retailBatchId/status', auth, async (req, res) => {
  try {
    const { status, quantityRemaining } = req.body;

    const update = { status };

    if (quantityRemaining !== undefined) {
      update.quantityRemaining = quantityRemaining;
    }

    await RetailBatch.updateOne(
      { retailBatchId: req.params.retailBatchId },
      { $set: update }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/batch/:retailBatchId', async (req, res) => {
  try {
    const rb = await RetailBatch.findOne({
      retailBatchId: req.params.retailBatchId
    });

    if (!rb) return res.status(404).json({ error: 'Retail batch not found' });

    const parent = await Batch.findOne({ batchId: rb.parentBatchId });

    res.json({ retailBatch: rb, parentBatch: parent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my-stock', auth, async (req, res) => {
  try {
    const stock = await RetailBatch.find({});
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const email = req.user.email?.trim().toLowerCase();

    const all = await RetailBatch.find({
      retailerEmail: email
    });

    const total = all.length;

    const received = all.filter(r =>
      r.status === 'Received' || r.status === 'On Shelf'
    ).length;

    const flagged = all.filter(r => r.isFraudFlagged).length;

    const expiring = all.filter(r => {
      if (!r.expiryDate) return false;

      const days = Math.ceil(
        (new Date(r.expiryDate) - new Date()) /
        (1000 * 60 * 60 * 24)
      );

      return days >= 0 && days <= 7;
    }).length;

    res.json({ total, received, flagged, expiring });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function runRetailFraudCheck(rb) {
  try {
    const now = new Date();
    const dispatchedAt = rb.dispatchedAt || now;

    const transportTime =
      (now - dispatchedAt) / (1000 * 60 * 60);

    const payload = {
      Batch_ID: rb.retailBatchId,
      Quantity: rb.quantityReceived || 100,
      Transport_Time: transportTime || 1,
      Checkpoint_Count: rb.status === 'Received' ? 1 : 0,
      Price: 100,
      Current_Status: rb.status || 'Dispatched',
      Last_Location: rb.retailerLocation || 'Retail',
      Distributor_ID: rb.retailerEmail || 'DIST-00',
      Production_Date: '',
      Expiry_Date: rb.expiryDate
        ? rb.expiryDate.toISOString()
        : '',
    };

    const response = await axios.post(
      `${ML_URL}/predict`,
      payload,
      { timeout: 10000 }
    );

    const result = response.data;

    await RetailBatch.updateOne(
      { retailBatchId: rb.retailBatchId },
      {
        $set: {
          fraudProbability: result.fraud_probability,
          fraudAlertLevel: result.alert_level,
          fraudTypes: result.fraud_types,
          isFraudFlagged: result.fraud_prediction === 1,
        }
      }
    );

    if (result.fraud_prediction === 1) {
      const existing = await Alert.findOne({
        batchId: rb.retailBatchId,
        status: 'OPEN'
      });

      if (!existing) {
        await new Alert({
          batchId: rb.retailBatchId,
          message: `Fraud detected on retail batch ${rb.retailBatchId}`,
          alertLevel: result.alert_level,
          fraudProbability: result.fraud_probability,
          fraudTypes: result.fraud_types,
          productType: rb.productType,
          location: rb.retailerLocation,
          source: 'AI',
          status: 'OPEN',
        }).save();

        console.log(
          `[AI] 🚨 Retail fraud alert — ${result.alert_level}`
        );
      }
    }

  } catch (err) {
    console.error('[AI] Retail fraud check failed:', err.message);
  }
}

module.exports = router;