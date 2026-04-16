// routes/retailRoutes.js
// Handles distributor → retailer dispatch and retailer dashboard

const express     = require('express');
const router      = express.Router();
const Batch       = require('../models/Batch');
const RetailBatch = require('../models/RetailBatch');
const Checkpoint  = require('../models/Checkpoint');
const Alert       = require('../models/Alert');
const auth        = require('../middleware/authMiddleware');
const { runFraudCheck } = require('../ai/fraudBridge');


// ════════════════════════════════════════════════════════
//  DISTRIBUTOR ROUTES — dispatch to retailers
// ════════════════════════════════════════════════════════

// POST /api/retail/dispatch
// Distributor splits a batch and sends portions to retailers
router.post('/dispatch', auth, async (req, res) => {
  try {
    const {
      parentBatchId,
      splits,   // array: [{ retailerEmail, retailerName, quantity, retailerLocation }]
    } = req.body;

    if (!parentBatchId || !splits || splits.length === 0) {
      return res.status(400).json({ error: 'parentBatchId and splits[] required' });
    }

    // Validate parent batch exists
    const parentBatch = await Batch.findOne({ batchId: parentBatchId });
    if (!parentBatch) {
      return res.status(404).json({ error: `Batch not found: ${parentBatchId}` });
    }

    // Validate total split quantity doesn't exceed parent
    const totalSplit = splits.reduce((sum, s) => sum + s.quantity, 0);
    if (totalSplit > (parentBatch.quantity || Infinity)) {
      return res.status(400).json({
        error: `Total split (${totalSplit}) exceeds batch quantity (${parentBatch.quantity})`,
      });
    }

    // Create a RetailBatch for each retailer
    const created = [];
    for (const split of splits) {
      const retailBatchId = `RETAIL-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;

      const rb = new RetailBatch({
        parentBatchId,
        retailBatchId,
        quantityReceived : split.quantity,
        quantityRemaining: split.quantity,
        retailerEmail    : split.retailerEmail,
        retailerName     : split.retailerName  || 'Unknown',
        retailerLocation : split.retailerLocation || '',
        productType      : parentBatch.productType,
        producerEmail    : parentBatch.producerEmail,
        expiryDate       : parentBatch.expiryDate,
        status           : 'Dispatched',
        dispatchedAt     : new Date(),
      });

      await rb.save();

      // Record a checkpoint on the parent batch for this dispatch event
      await new Checkpoint({
        batchId    : parentBatchId,
        location   : split.location || { latitude: 0, longitude: 0 },
        timestamp  : new Date(),
        scannerRole: 'distributor',
      }).save();

      // Run AI fraud check on this retail split
      runRetailFraudCheck(rb);

      created.push({ retailBatchId, retailerEmail: split.retailerEmail, quantity: split.quantity });
    }

    // Update parent batch status
    await Batch.updateOne({ batchId: parentBatchId }, {
      $set: { status: 'Dispatched to Retail' },
    });

    res.json({ success: true, dispatched: created });

  } catch (err) {
    console.error('[Retail] Dispatch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// GET /api/retail/distributor/dispatches
// All retail dispatches made by this distributor (via their batches)
router.get('/distributor/dispatches', auth, async (req, res) => {
  try {
    // Find all batches owned by this distributor
    const batches = await Batch.find({ producerEmail: req.user.email });
    const batchIds = batches.map(b => b.batchId);

    const dispatches = await RetailBatch.find({
      parentBatchId: { $in: batchIds },
    }).sort({ createdAt: -1 });

    res.json(dispatches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ════════════════════════════════════════════════════════
//  RETAILER ROUTES — receive and manage their stock
// ════════════════════════════════════════════════════════

// GET /api/retail/my-stock
// Retailer sees all batches assigned to them
router.get('/my-stock', auth, async (req, res) => {
  try {
    const stock = await RetailBatch.find({ retailerEmail: req.user.email })
      .sort({ createdAt: -1 });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PATCH /api/retail/:retailBatchId/receive
// Retailer confirms receipt of a batch
router.patch('/:retailBatchId/receive', auth, async (req, res) => {
  try {
    const { location } = req.body;
    const rb = await RetailBatch.findOne({ retailBatchId: req.params.retailBatchId });
    if (!rb) return res.status(404).json({ error: 'Retail batch not found' });

    rb.status     = 'Received';
    rb.receivedAt = new Date();
    if (location) rb.location = location;
    await rb.save();

    // Record checkpoint on parent batch
    await new Checkpoint({
      batchId    : rb.parentBatchId,
      location   : location || { latitude: 0, longitude: 0 },
      timestamp  : new Date(),
      scannerRole: 'retailer',
    }).save();

    // Run AI fraud check after receipt
    runRetailFraudCheck(rb);

    res.json({ success: true, retailBatchId: rb.retailBatchId, status: rb.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PATCH /api/retail/:retailBatchId/status
// Update status: On Shelf / Sold Out
router.patch('/:retailBatchId/status', auth, async (req, res) => {
  try {
    const { status, quantityRemaining } = req.body;
    const update = { status };
    if (quantityRemaining !== undefined) update.quantityRemaining = quantityRemaining;

    await RetailBatch.updateOne({ retailBatchId: req.params.retailBatchId }, { $set: update });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/retail/batch/:retailBatchId
// Full details of a retail batch (for consumer / government scan)
router.get('/batch/:retailBatchId', async (req, res) => {
  try {
    const rb = await RetailBatch.findOne({ retailBatchId: req.params.retailBatchId });
    if (!rb) return res.status(404).json({ error: 'Retail batch not found' });

    // Also fetch parent batch info
    const parent = await Batch.findOne({ batchId: rb.parentBatchId });

    res.json({ retailBatch: rb, parentBatch: parent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/retail/stats
// Stats for retailer dashboard
router.get('/stats', auth, async (req, res) => {
  try {
    const all      = await RetailBatch.find({ retailerEmail: req.user.email });
    const total    = all.length;
    const received = all.filter(r => r.status === 'Received' || r.status === 'On Shelf').length;
    const flagged  = all.filter(r => r.isFraudFlagged).length;
    const expiring = all.filter(r => {
      if (!r.expiryDate) return false;
      const days = Math.ceil((new Date(r.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }).length;

    res.json({ total, received, flagged, expiring });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ════════════════════════════════════════════════════════
//  AI FRAUD CHECK FOR RETAIL BATCHES
// ════════════════════════════════════════════════════════

const axios = require('axios');
const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

async function runRetailFraudCheck(rb) {
  try {
    const now          = new Date();
    const dispatchedAt = rb.dispatchedAt || now;
    const transportTime = (now - dispatchedAt) / (1000 * 60 * 60); // hours since dispatch

    const payload = {
      Batch_ID         : rb.retailBatchId,
      Quantity         : rb.quantityReceived  || 100,
      Transport_Time   : transportTime        || 1,
      Checkpoint_Count : rb.status === 'Received' ? 1 : 0,
      Price            : 100,
      Current_Status   : rb.status            || 'Dispatched',
      Last_Location    : rb.retailerLocation  || 'Retail',
      Distributor_ID   : rb.retailerEmail     || 'DIST-00',
      Production_Date  : '',
      Expiry_Date      : rb.expiryDate ? rb.expiryDate.toISOString() : '',
    };

    const response = await axios.post(`${ML_URL}/predict`, payload, { timeout: 10000 });
    const result   = response.data;

    await RetailBatch.updateOne({ retailBatchId: rb.retailBatchId }, {
      $set: {
        fraudProbability : result.fraud_probability,
        fraudAlertLevel  : result.alert_level,
        fraudTypes       : result.fraud_types,
        isFraudFlagged   : result.fraud_prediction === 1,
      },
    });

    if (result.fraud_prediction === 1) {
      const existing = await Alert.findOne({
        batchId   : rb.retailBatchId,
        status    : 'OPEN',
      });
      if (!existing) {
        await new Alert({
          batchId          : rb.retailBatchId,
          message          : `Fraud detected on retail batch ${rb.retailBatchId} (${rb.productType}). Score: ${result.fraud_probability}. Types: ${result.fraud_types.join(', ')}`,
          alertLevel       : result.alert_level,
          fraudProbability : result.fraud_probability,
          fraudTypes       : result.fraud_types,
          productType      : rb.productType,
          location         : rb.retailerLocation,
          source           : 'AI',
          status           : 'OPEN',
        }).save();
        console.log(`[AI] 🚨 Retail fraud alert — ${result.alert_level} for ${rb.retailBatchId}`);
      }
    }
  } catch (err) {
    console.error('[AI] Retail fraud check failed:', err.message);
  }
}

module.exports = router;