const mongoose = require('mongoose');

const CompanyStatsSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    unique: true
  },
  totalProperties: {
    type: Number,
    default: 0
  },
  highValueProperties: {
    type: Number,
    default: 0
  },
  newProperties: {
    type: Number,
    default: 0
  },
  topOwners: {
    type: Array,
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CompanyStats', CompanyStatsSchema);