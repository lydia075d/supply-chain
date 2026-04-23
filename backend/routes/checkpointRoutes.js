const express = require("express");
const router = express.Router();
const axios = require("axios");

const Checkpoint = require("../models/Checkpoint");
const Alert = require("../models/Alert");
const Batch = require("../models/Batch");
const auth = require("../middleware/authMiddleware");
const blockchainService = require("../blockchain/service");

const AI_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

// ─────────────────────────────────────────────────────────
// POST / — record checkpoint + AI + alerts + blockchain
// ─────────────────────────────────────────────────────────
router.post("/", auth, async (req, res) => {
  try {
    const { batchId, location, timestamp, scannerRole, temperature } = req.body;

    // ── VALIDATION ────────────────────────────────────────
    if (!batchId) {
      return res.status(400).json({ error: "batchId is required" });
    }

    if (!location || location.latitude == null || location.longitude == null) {
      return res.status(400).json({ error: "Invalid location data" });
    }

    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({ error: `Batch not found: ${batchId}` });
    }

    // ── SAVE CHECKPOINT ───────────────────────────────────
    const checkpoint = new Checkpoint({
      batchId,
      location,
      timestamp,
      scannerRole,
    });
    await checkpoint.save();

    // ── UPDATE BATCH ──────────────────────────────────────
    const newCheckpointCount = (batch.checkpoints || 0) + 1;

    await Batch.updateOne(
      { batchId },
      {
        $inc: { checkpoints: 1 },
        $set: {
          currentLocation: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
          status: "In Transit",
        },
      }
    );

    // ── ANOMALY FLAGS ─────────────────────────────────────
    let anomalyDetected = false;
    let anomalyType = null;
    let anomalyDetails = null;

    // ─────────────────────────────────────────────────────
    // 🤖 AI FRAUD CHECK
    // ─────────────────────────────────────────────────────
    let aiFraudDetected = false;
    let aiAlertLevel = "LOW";
    let aiFraudTypes = [];
    let aiFraudProb = 0;

    try {
      const aiPayload = {
        Batch_ID: batchId,
        Quantity: batch.quantity || 100,
        Transport_Time: req.body.transportTime || 24,
        Checkpoint_Count: newCheckpointCount, // ✅ FIXED (no double increment)
        Price: batch.price || 100,
        Current_Status: "In Transit",
        Last_Location: scannerRole || "Storage",
        Distributor_ID: batch.distributorId || "DIST-00",
        Production_Date: batch.productionDate
          ? new Date(batch.productionDate).toISOString()
          : "",
        Expiry_Date: batch.expiryDate
          ? new Date(batch.expiryDate).toISOString()
          : "",
      };

      const aiRes = await axios.post(`${AI_URL}/predict`, aiPayload, {
        timeout: 10000,
      });

      console.log("✅ AI RESULT:", aiRes.data);

      aiFraudDetected = aiRes.data.fraud_prediction === 1;
      aiAlertLevel = aiRes.data.alert_level || "LOW";
      aiFraudTypes = aiRes.data.fraud_types || ["ML_DETECTED_ANOMALY"];
      aiFraudProb = aiRes.data.fraud_probability || 0;

      if (aiFraudDetected) {
        await new Alert({
          message: `🚨 AI Alert [${aiAlertLevel}]: ${aiFraudTypes.join(", ")}`,
          batchId: batchId,
          type: aiFraudTypes.join(", "),
          severity: aiAlertLevel.toLowerCase(),
          fraudProbability: aiFraudProb,     // ✅ ADDED
          product: batch.productType,        // ✅ ADDED
          alertLevel: aiAlertLevel,          // ✅ ADDED
          resolved: false,
          time: new Date(),
        }).save();

        console.log(`🚨 AI Alert saved for batch ${batchId}`);
      }

    } catch (aiErr) {
      console.log("❌ AI service error:", aiErr.message);
    }

    // ─────────────────────────────────────────────────────
    // 🌡️ TEMPERATURE ANOMALY
    // ─────────────────────────────────────────────────────
    if (temperature && temperature > 10) {
      anomalyDetected = true;
      anomalyType = "Temperature Anomaly";
      anomalyDetails = `Temperature ${temperature}°C exceeds safe threshold`;

      await new Alert({
        message: `🌡️ Temperature Alert: ${anomalyDetails}`,
        batchId: batchId,
        type: "TEMPERATURE_ANOMALY",
        severity: "medium",
        product: batch.productType,
        resolved: false,
        time: new Date(),
      }).save();
    }

    // ─────────────────────────────────────────────────────
    // 🔗 BLOCKCHAIN
    // ─────────────────────────────────────────────────────
    let blockchainResult = null;

    if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
      try {
        const locationName = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

        blockchainResult =
          await blockchainService.recordCheckpointToBlockchain(
            batchId,
            location.latitude,
            location.longitude,
            scannerRole || "distributor",
            locationName,
            process.env.BLOCKCHAIN_PRIVATE_KEY
          );
      } catch (bcError) {
        console.error("[Blockchain Error]:", bcError.message);
      }
    }

    // ─────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────
    res.json({
      success: true,
      checkpointId: checkpoint._id,
      batchId,
      productType: batch.productType,

      anomalyDetected,
      anomalyType,
      anomalyDetails,

      ai: {
        fraudDetected: aiFraudDetected,
        fraudProbability: aiFraudProb,
        alertLevel: aiAlertLevel,
        fraudTypes: aiFraudTypes,
      },

      blockchain: blockchainResult
        ? {
            recorded: blockchainResult.success,
            transactionHash: blockchainResult.transactionHash,
            blockNumber: Number(blockchainResult.blockNumber),
            blockHash: blockchainResult.blockHash,
            gasUsed: Number(blockchainResult.gasUsed),
          }
        : {
            recorded: false,
            message: "Blockchain not configured",
          },
    });

  } catch (err) {
    console.error("[Checkpoint Error]:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /recent
// ─────────────────────────────────────────────────────────
router.get("/recent", auth, async (req, res) => {
  try {
    const checkpoints = await Checkpoint.find({ scannerRole: "distributor" })
      .sort({ timestamp: -1 })
      .limit(20);

    const enriched = await Promise.all(
      checkpoints.map(async (cp) => {
        const batch = await Batch.findOne({ batchId: cp.batchId });

        return {
          batchId: cp.batchId,
          productType: batch?.productType || "Unknown",
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