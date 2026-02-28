const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/ai-test", async (req, res) => {
  try {
    const response = await axios.get("http://127.0.0.1:8000");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "AI server not responding" });
  }
});

module.exports = router;