const mongoose = require('mongoose');

const SearchHistorySchema = new mongoose.Schema({
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
  query: {
    type: String,
    required: true
  },
  searchType: {
    type: String,
    enum: ['map_click', 'text_search', 'filter_search', 'advanced_search'],
    default: 'text_search'
  },
  propertyId: {
    type: Number, // ATTOM ID
    default: null
  },
  filters: {
    type: Object,
    default: {}
  },
  results: {
    count: { type: Number, default: 0 },
    properties: { type: Array, default: [] }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
SearchHistorySchema.index({ company: 1, createdAt: -1 });
SearchHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);