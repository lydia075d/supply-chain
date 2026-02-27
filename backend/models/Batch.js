const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  productType: { type: String, required: true },
  quantity: { type: Number, required: true },
  productionDate: { type: String },
  expiryDate: { type: String },
  status: { type: String, default: 'At Farm' },
  checkpoints: { type: Number, default: 0 },
  currentLocation: { type: String, default: 'Farm' },
  producerEmail: { type: String },
  producer: { type: String },
  fssaiLicense: { type: String },
  hasIssues: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Batch', BatchSchema);