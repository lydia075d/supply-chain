const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const Checkpoint = require("../models/Checkpoint");
const blockchainService = require("../blockchain/service");

// Consumer verify endpoint
router.get("/verify/:batchId", async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const checkpoints = await Checkpoint.find({
      batchId: req.params.batchId,
    }).sort({ timestamp: 1 });

    const formattedCheckpoints = checkpoints.map((cp) => ({
      location: `Lat: ${cp.location.latitude.toFixed(4)}, Lng: ${cp.location.longitude.toFixed(4)}`,
      latitude: cp.location.latitude,
      longitude: cp.location.longitude,
      timestamp: new Date(cp.timestamp).toLocaleString(),
      timestampUnix: new Date(cp.timestamp).getTime(),
      status: cp.scannerRole === "distributor" ? "In Transit" : "Checkpoint",
      scannerRole: cp.scannerRole,
    }));

    // Try to get blockchain data if configured
    let blockchainData = null;
    if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
      try {
        const bcResult = await blockchainService.getCheckpointsFromBlockchain(
          req.params.batchId,
        );
        if (bcResult.success && bcResult.checkpoints.length > 0) {
          blockchainData = {
            recorded: true,
            checkpointCount: bcResult.count,
            checkpoints: bcResult.checkpoints.map((cp) => ({
              location: `Lat: ${cp.latitude.toFixed(4)}, Lng: ${cp.longitude.toFixed(4)}`,
              latitude: cp.latitude,
              longitude: cp.longitude,
              timestamp: cp.timestamp,
              scannerRole: cp.scannerRole,
              locationName: cp.locationName,
              recordedBy: cp.recordedBy,
              blockNumber: cp.blockNumber,
              transactionVerified: true,
            })),
          };
        }
      } catch (bcError) {
        console.error("[Verify] Blockchain error:", bcError.message);
      }
    }

    res.json({
      batchId: batch.batchId,
      isAuthentic: true,
      productType: batch.productType,
      producer: batch.producer || batch.producerEmail,
      quantity: `${batch.quantity} kg`,
      productionDate:
        batch.productionDate || batch.createdAt?.toISOString().split("T")[0],
      expiryDate: batch.expiryDate || "N/A",
      fssaiLicense: batch.fssaiLicense || "N/A",
      checkpoints: formattedCheckpoints,
      blockchain: blockchainData || {
        recorded: false,
        message:
          blockchainData === null
            ? "Blockchain data unavailable"
            : "No checkpoints recorded on blockchain",
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
