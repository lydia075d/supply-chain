const express = require("express");
const router  = express.Router();
const AI_URL  = "http://127.0.0.1:8000";

// lazy-load axios inside handlers to avoid export issues
const ai = () => require("axios");

// GET /api/ai-test — check if Python server is alive
router.get("/ai-test", async (req, res) => {
  try {
    const r = await ai().get(AI_URL);
    res.json({ status: "connected", message: r.data.message });
  } catch (e) {
    res.status(503).json({ status: "disconnected", error: e.message });
  }
});

// POST /api/ai/detect — fraud check on a single record
router.post("/ai/detect", async (req, res) => {
  try {
    const r = await ai().post(`${AI_URL}/predict`, req.body);
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ai/scan-all — scan every batch in MongoDB
router.get("/ai/scan-all", async (req, res) => {
  try {
    const r = await ai().get(`${AI_URL}/scan-all`);
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;