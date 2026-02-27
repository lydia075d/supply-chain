const express = require('express');
const router = express.Router();
const Checkpoint = require('../models/Checkpoint');
const Alert = require('../models/Alert');
const Batch = require('../models/Batch');
const auth = require('../middleware/authMiddleware');

// POST / — record a new checkpoint
router.post('/', auth, async (req, res) => {
  try {
    const { batchId, location, timestamp, scannerRole } = req.body;

    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required' });
    }

    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({ error: `Batch not found: ${batchId}` });
    }

    const checkpoint = new Checkpoint({ batchId, location, timestamp, scannerRole });
    await checkpoint.save();

    // Update batch checkpoint count and location
    await Batch.updateOne(
      { batchId },
      {
        $inc: { checkpoints: 1 },
        $set: {
          currentLocation: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
          status: 'In Transit',
        },
      }
    );

    let anomalyDetected = false;
    let anomalyType = null;
    let anomalyDetails = null;

    if (req.body.temperature > 10) {
      anomalyDetected = true;
      anomalyType = 'Temperature Anomaly';
      anomalyDetails = `Temperature ${req.body.temperature}°C exceeds safe threshold of 10°C.`;
      await new Alert({ message: anomalyDetails, batchId, timestamp }).save();
    }

    res.json({
      success: true,
      checkpointId: checkpoint._id,
      batchId,
      productType: batch.productType,
      anomalyDetected,
      anomalyType,
      anomalyDetails,
    });
  } catch (err) {
    console.error('[Checkpoint] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /recent — last 20 checkpoints scanned by this distributor
router.get('/recent', auth, async (req, res) => {
  try {
    const checkpoints = await Checkpoint.find({ scannerRole: 'distributor' })
      .sort({ timestamp: -1 })
      .limit(20);

    // Enrich with productType from Batch
    const enriched = await Promise.all(
      checkpoints.map(async (cp) => {
        const batch = await Batch.findOne({ batchId: cp.batchId });
        return {
          batchId: cp.batchId,
          productType: batch?.productType || 'Unknown',
          location: `${cp.location.latitude.toFixed(4)}, ${cp.location.longitude.toFixed(4)}`,
          timestamp: cp.timestamp,
          anomaly: false,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;