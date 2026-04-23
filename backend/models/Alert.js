const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    message          : { type: String, required: true },
    batchId          : { type: String, default: null },
    type             : { type: String, default: 'unknown' },
    severity         : { type: String, default: 'medium', enum: ['low', 'medium', 'high', 'critical'] },
    resolved         : { type: Boolean, default: false },
    fraudProbability : { type: Number, default: null },   // ← ADD: AI score 0-1
    product          : { type: String, default: null },   // ← ADD: product name
    alertLevel       : { type: String, default: null },   // ← ADD: LOW/MEDIUM/HIGH/CRITICAL
    time             : { type: Date, default: Date.now },
  },
  { timestamps: true }  // adds createdAt + updatedAt automatically
);

module.exports = mongoose.model('Alert', AlertSchema);