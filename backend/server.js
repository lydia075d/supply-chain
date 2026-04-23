require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(
  cors({
    origin: "*", 
  })
);
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/batch", require("./routes/batchRoutes"));
app.use("/api/checkpoint", require("./routes/checkpointRoutes"));
app.use("/api/retail", require("./routes/retailRoutes")); 

// ✅ Feature routes
app.use("/api", require("./routes/governmentRoutes"));
app.use("/api", require("./routes/verifyRoutes"));

// ✅ AI routes (manual/debug endpoints)
app.use("/api", require("./routes/ai"));

app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});