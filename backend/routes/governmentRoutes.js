const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Alert = require('../models/Alert');
const Checkpoint = require('../models/Checkpoint');
const auth = require('../middleware/authMiddleware');

router.get('/government/batches', auth, async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });

    // Attach real checkpoint count to each batch
    const batchesWithCounts = await Promise.all(
      batches.map(async (batch) => {
        const checkpointCount = await Checkpoint.countDocuments({ batchId: batch.batchId });
        return {
          ...batch.toObject(),
          checkpoints: checkpointCount,
        };
      })
    );

    res.json(batchesWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/government/alerts', auth, async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;