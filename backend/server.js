require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins (for development)
  }),
);
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/batch", require("./routes/batchRoutes"));
app.use("/api/checkpoint", require("./routes/checkpointRoutes"));
app.use("/api", require("./routes/governmentRoutes"));
app.use("/api", require("./routes/verifyRoutes"));

// AI Routes
const aiRoutes = require("./routes/ai");
app.use("/api", aiRoutes);

// Start Server
const PORT = process.env.PORT || 5000; // ✅ fallback to 5000 if PORT missing in .env
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
