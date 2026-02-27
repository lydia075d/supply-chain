const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({

  productName: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  producerEmail: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('Batch', BatchSchema);