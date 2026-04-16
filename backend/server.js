require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB().then(() => {
  console.log('MongoDB connected');

  // NEW: run bulk AI fraud scan every 1 hour
  const { runBulkFraudScan } = require('./ai/fraudBridge');
  setInterval(() => {
    console.log('[AI] Running scheduled fraud scan...');
    runBulkFraudScan();
  }, 60 * 60 * 1000);

  // NEW: also run once on startup after 5 seconds
  setTimeout(() => runBulkFraudScan(), 5000);
}).catch(err => console.error('MongoDB error:', err));

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Your original routes — UNCHANGED
app.use("/api/auth",       require("./routes/authRoutes"));
app.use("/api/batch",      require("./routes/batchRoutes"));
app.use("/api/checkpoint", require("./routes/checkpointRoutes"));
app.use("/api",            require("./routes/governmentRoutes"));
app.use("/api",            require("./routes/verifyRoutes"));
app.use("/api",            require("./routes/ai"));

// NEW: retailer routes
app.use("/api/retail",     require("./routes/retailRoutes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));