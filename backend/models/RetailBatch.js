const mongoose = require('mongoose');

const RetailBatchSchema = new mongoose.Schema({

  parentBatchId   : { type: String, required: true },  
  retailBatchId   : { type: String, required: true, unique: true }, 

  quantityReceived : { type: Number, required: true }, 
  quantityRemaining: { type: Number },       

  retailerEmail   : { type: String, required: true },
  retailerName    : { type: String, default: 'Unknown Retailer' },
  retailerLocation: { type: String },

  productType     : String,
  producerEmail   : String,
  expiryDate      : Date,

  status          : { type: String, default: 'Dispatched' },
  // Dispatched → Received → On Shelf → Sold Out
  dispatchedAt    : { type: Date, default: Date.now },
  receivedAt      : Date,
  location        : {
    latitude: { type: Number, required: true },
longitude: { type: Number, required: true },
  },

  fraudProbability : { type: Number, default: 0 },
  fraudAlertLevel  : { type: String, default: 'NONE' },
  fraudTypes       : [String],
  isFraudFlagged   : { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('RetailBatch', RetailBatchSchema);