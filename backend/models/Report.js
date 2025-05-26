const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
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
  propertyId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    enum: ['market_analysis', 'investment_summary', 'property_overview', 'risk_assessment'],
    default: 'property_overview'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
ReportSchema.index({ company: 1, createdAt: -1 });
// CHANGE: Make unique constraint on savedProperty + reportType combination instead of just savedProperty
ReportSchema.index({ savedProperty: 1, reportType: 1 }, { unique: true });
ReportSchema.index({ propertyId: 1 });

module.exports = mongoose.model('Report', ReportSchema);