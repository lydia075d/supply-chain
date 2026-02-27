require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/batch', require('./routes/batchRoutes'));
app.use('/api/checkpoint', require('./routes/checkpointRoutes'));
app.use('/api', require('./routes/governmentRoutes'));
app.use('/api', require('./routes/verifyRoutes'));

app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});