const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const auth = require('../middleware/authMiddleware');

router.post('/create', auth, async (req, res) => {
  try {
    const batch = new Batch({
      ...req.body,
      producerEmail: req.user.email
    });

    await batch.save();

    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/producer/batches', auth, async (req, res) => {
  try {
    const batches = await Batch.find({
      producerEmail: req.user.email
    });

    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get Single Batch
router.get('/batch/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;