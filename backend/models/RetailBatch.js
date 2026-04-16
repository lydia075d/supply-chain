// models/RetailBatch.js
// Tracks how a distributor splits a batch across multiple retailers

const mongoose = require('mongoose');

const RetailBatchSchema = new mongoose.Schema({

  // ── Link back to parent batch ──────────────────────────
  parentBatchId   : { type: String, required: true },  // original BATCH-xxx
  retailBatchId   : { type: String, required: true, unique: true }, // RETAIL-xxx

  // ── Quantity split ─────────────────────────────────────
  quantityReceived : { type: Number, required: true },  // units sent to this retailer
  quantityRemaining: { type: Number },                  // for retailer's own tracking

  // ── Retailer info ──────────────────────────────────────
  retailerEmail   : { type: String, required: true },
  retailerName    : { type: String, default: 'Unknown Retailer' },
  retailerLocation: { type: String },

  // ── Product info (copied from parent) ─────────────────
  productType     : String,
  producerEmail   : String,
  expiryDate      : Date,

  // ── Logistics ─────────────────────────────────────────
  status          : { type: String, default: 'Dispatched' },
  // Dispatched → Received → On Shelf → Sold Out
  dispatchedAt    : { type: Date, default: Date.now },
  receivedAt      : Date,
  location        : {
    latitude : Number,
    longitude: Number,
  },

  // ── AI fraud result ────────────────────────────────────
  fraudProbability : { type: Number, default: 0 },
  fraudAlertLevel  : { type: String, default: 'NONE' },
  fraudTypes       : [String],
  isFraudFlagged   : { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('RetailBatch', RetailBatchSchema);