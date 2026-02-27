const mongoose = require('mongoose');

const CheckpointSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
  },
  timestamp: { type: Date, default: Date.now },
  scannerRole: { type: String, default: 'distributor' },
  temperature: { type: Number },
});

module.exports = mongoose.model('Checkpoint', CheckpointSchema);