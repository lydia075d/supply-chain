const express = require("express");
const router = express.Router();
const axios = require("axios");

const Batch = require("../models/Batch");
const Alert = require("../models/Alert");
const Checkpoint = require("../models/Checkpoint");
const auth = require("../middleware/authMiddleware");
const blockchainService = require("../blockchain/service");

const AI_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

// ─────────────────────────────────────────────────────────
// 🔒 Middleware: Government only
// ─────────────────────────────────────────────────────────
const onlyGov = (req, res, next) => {
  if (req.user.role !== "government") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
};

// ─────────────────────────────────────────────────────────
// GET /government/batches
// ─────────────────────────────────────────────────────────
router.get("/government/batches", auth, onlyGov, async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });

    const enriched = await Promise.all(
      batches.map(async (batch) => {
        const checkpointCount = await Checkpoint.countDocuments({
          batchId: batch.batchId,
        });

        const alertCount = await Alert.countDocuments({
          batchId: batch.batchId,
          resolved: false,
        });

        let blockchainCheckpointCount = null;

        if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
          try {
            const bc = await blockchainService.getCheckpointCountFromBlockchain(
              batch.batchId
            );
            if (bc.success) blockchainCheckpointCount = bc.count;
          } catch (err) {
            console.log("Blockchain count error:", err.message);
          }
        }

        return {
          ...batch.toObject(),
          checkpoints: checkpointCount,
          blockchainCheckpoints: blockchainCheckpointCount,
          hasIssues: alertCount > 0,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("[Government batches error]:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /government/alerts
// ─────────────────────────────────────────────────────────
router.get("/government/alerts", auth, onlyGov, async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ time: -1 })   // ✅ consistent with your schema
      .limit(100);

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// POST /government/scan (AI bulk scan)
// ─────────────────────────────────────────────────────────
router.post("/government/scan", auth, onlyGov, async (req, res) => {
  let aiAlertsCount = 0;

  try {
    const aiRes = await axios.get(`${AI_URL}/scan-all`, { timeout: 30000 });

    const aiAlerts = aiRes.data.alerts || [];
    aiAlertsCount = aiAlerts.length;

    for (const a of aiAlerts) {
      const fraudType = Array.isArray(a.fraud_types)
        ? a.fraud_types[0]
        : "unknown";

      const exists = await Alert.findOne({
        batchId: a.batch_id,
        type: fraudType,
        resolved: false,
      });

      if (!exists) {
        await Alert.create({
          message: `AI Detected: ${
            Array.isArray(a.fraud_types)
              ? a.fraud_types.join(", ")
              : a.fraud_types
          }`,
          batchId: a.batch_id,
          type: fraudType,
          severity: (a.alert_level || "medium").toLowerCase(),
          fraudProbability: a.fraud_probability || null,
          product: a.product || null,
          alertLevel: a.alert_level || null,
          resolved: false,
          time: new Date(),
        });
      }
    }
  } catch (err) {
    console.warn("[AI scan failed]:", err.message);
  }

  const alerts = await Alert.find().sort({ time: -1 }).limit(100);

  res.json({
    scanned: true,
    aiAlertsFound: aiAlertsCount,
    alerts,
  });
});

// ─────────────────────────────────────────────────────────
// PATCH /government/alerts/:id/resolve
// ─────────────────────────────────────────────────────────
router.patch(
  "/government/alerts/:id/resolve",
  auth,
  onlyGov,
  async (req, res) => {
    try {
      const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        { resolved: true },
        { new: true }
      );

      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      res.json(alert);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────
// PATCH approve / reject
// ─────────────────────────────────────────────────────────
router.patch("/government/approve/:batchId", auth, onlyGov, async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    batch.approvalStatus = "APPROVED";
    batch.approvedAt = new Date();
    batch.approvedBy = req.user.email;

    await batch.save();

    res.json({ message: "Batch approved", batch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/government/reject/:batchId", auth, onlyGov, async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    batch.approvalStatus = "REJECTED";

    await batch.save();

    res.json({ message: "Batch rejected", batch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /government/batch/:batchId/checkpoints
// ─────────────────────────────────────────────────────────
router.get(
  "/government/batch/:batchId/checkpoints",
  auth,
  onlyGov,
  async (req, res) => {
    try {
      const batch = await Batch.findOne({ batchId: req.params.batchId });
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      const mongoCheckpoints = await Checkpoint.find({
        batchId: req.params.batchId,
      }).sort({ timestamp: 1 });

      let blockchainCheckpoints = null;

      if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
        try {
          const bc = await blockchainService.getCheckpointsFromBlockchain(
            req.params.batchId
          );
          if (bc.success) blockchainCheckpoints = bc.checkpoints;
        } catch (err) {
          console.log("Blockchain fetch error:", err.message);
        }
      }

      res.json({
        batchId: batch.batchId,
        productType: batch.productType,
        mongoCheckpoints,
        blockchainCheckpoints,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;