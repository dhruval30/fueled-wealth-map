const mongoose = require('mongoose');

const SavedPropertySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  attomId: {
    type: Number,
    required: true
  },
  propertyData: {
    type: Object,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
SavedPropertySchema.index({ company: 1, savedAt: -1 });
SavedPropertySchema.index({ user: 1, savedAt: -1 });
SavedPropertySchema.index({ company: 1, attomId: 1 }, { unique: true });

module.exports = mongoose.model('SavedProperty', SavedPropertySchema);