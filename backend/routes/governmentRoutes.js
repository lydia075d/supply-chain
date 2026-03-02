const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const Alert = require("../models/Alert");
const Checkpoint = require("../models/Checkpoint");
const auth = require("../middleware/authMiddleware");
const blockchainService = require("../blockchain/service");

router.get("/government/batches", auth, async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });

    // Attach real checkpoint count to each batch
    const batchesWithCounts = await Promise.all(
      batches.map(async (batch) => {
        const checkpointCount = await Checkpoint.countDocuments({
          batchId: batch.batchId,
        });

        // Try to get blockchain checkpoint count
        let blockchainCheckpointCount = null;
        if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
          try {
            const bcResult =
              await blockchainService.getCheckpointCountFromBlockchain(
                batch.batchId,
              );
            if (bcResult.success) {
              blockchainCheckpointCount = bcResult.count;
            }
          } catch (bcError) {
            console.error("[Government] Blockchain error:", bcError.message);
          }
        }

        return {
          ...batch.toObject(),
          checkpoints: checkpointCount,
          blockchainCheckpoints: blockchainCheckpointCount,
        };
      }),
    );

    res.json(batchesWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/government/alerts", auth, async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Government can view detailed blockchain checkpoints for any batch
router.get("/government/batch/:batchId/checkpoints", auth, async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Get MongoDB checkpoints
    const mongoCheckpoints = await Checkpoint.find({
      batchId: req.params.batchId,
    }).sort({ timestamp: 1 });

    // Get blockchain checkpoints
    let blockchainCheckpoints = null;
    if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
      try {
        const bcResult = await blockchainService.getCheckpointsFromBlockchain(
          req.params.batchId,
        );
        if (bcResult.success) {
          blockchainCheckpoints = bcResult.checkpoints;
        }
      } catch (bcError) {
        console.error("[Government] Blockchain error:", bcError.message);
      }
    }

    res.json({
      batchId: batch.batchId,
      productType: batch.productType,
      mongoCheckpoints: mongoCheckpoints,
      blockchainCheckpoints: blockchainCheckpoints,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
