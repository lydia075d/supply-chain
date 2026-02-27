const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Checkpoint = require('../models/Checkpoint');
const auth = require('../middleware/authMiddleware');

router.post('/create', auth, async (req, res) => {
  try {
    const batch = new Batch({
      ...req.body,
      producerEmail: req.user.email,
    });
    await batch.save();
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/producer/batches', auth, async (req, res) => {
  try {
    const batches = await Batch.find({ producerEmail: req.user.email });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FIX: look up by batchId string, not MongoDB _id
// Also returns checkpoints for BatchDetailsScreen
router.get('/batchId/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Fetch all checkpoints for this batch
    const checkpoints = await Checkpoint.find({ batchId: req.params.batchId }).sort({ timestamp: 1 });

    // Format checkpoints for the frontend
    const formattedCheckpoints = checkpoints.map(cp => ({
      location: `${cp.location.latitude.toFixed(4)}, ${cp.location.longitude.toFixed(4)}`,
      latitude: String(cp.location.latitude),
      longitude: String(cp.location.longitude),
      timestamp: new Date(cp.timestamp).toLocaleString(),
      status: cp.scannerRole === 'distributor' ? 'In Transit' : 'Checkpoint',
      scanner: cp.scannerRole,
    }));

    res.json({
      ...batch.toObject(),
      checkpoints: formattedCheckpoints,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;