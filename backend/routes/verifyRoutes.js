const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Checkpoint = require('../models/Checkpoint');

// Consumer verify endpoint
router.get('/verify/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const checkpoints = await Checkpoint.find({ batchId: req.params.batchId }).sort({ timestamp: 1 });

    const formattedCheckpoints = checkpoints.map(cp => ({
      location: `Lat: ${cp.location.latitude.toFixed(4)}, Lng: ${cp.location.longitude.toFixed(4)}`,
      timestamp: new Date(cp.timestamp).toLocaleString(),
      status: cp.scannerRole === 'distributor' ? 'In Transit' : 'Checkpoint',
    }));

    res.json({
      batchId: batch.batchId,
      isAuthentic: true,
      productType: batch.productType,
      producer: batch.producer || batch.producerEmail,
      quantity: `${batch.quantity} kg`,
      productionDate: batch.productionDate || batch.createdAt?.toISOString().split('T')[0],
      expiryDate: batch.expiryDate || 'N/A',
      fssaiLicense: batch.fssaiLicense || 'N/A',
      checkpoints: formattedCheckpoints,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;