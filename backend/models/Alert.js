const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  message: { type: String, required: true },
  batchId: { type: String },
  type: { type: String, default: 'temperature' },
  severity: { type: String, default: 'medium' },
  resolved: { type: Boolean, default: false },
  time: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Alert', AlertSchema);