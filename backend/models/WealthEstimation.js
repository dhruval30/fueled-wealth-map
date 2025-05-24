const mongoose = require('mongoose');

const WealthEstimationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  savedProperty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavedProperty',
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  propertyAddress: {
    type: String,
    required: true
  },
  propertyValue: {
    type: Number,
    default: null
  },
  annualPropertyTax: {
    type: Number,
    default: null
  },
  zipCode: {
    type: String,
    default: null
  },
  zipCodeMedianNetWorth: {
    type: Number,
    default: null
  },
  estimatedNetWorth: {
    type: Number,
    required: true
  },
  confidence: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  estimatedAt: {
    type: Date,
    default: Date.now
  },
  groqResponse: {
    type: String,
    default: null
  }
});

// Add indexes for better query performance
WealthEstimationSchema.index({ company: 1, estimatedAt: -1 });
WealthEstimationSchema.index({ savedProperty: 1 }, { unique: true });

module.exports = mongoose.model('WealthEstimation', WealthEstimationSchema);