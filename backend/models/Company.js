const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  dataAccessPreferences: {
    allowNetWorthView: { type: Boolean, default: true },
    allowDataExport: { type: Boolean, default: true },
    allowOwnershipHistoryView: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('Company', CompanySchema);