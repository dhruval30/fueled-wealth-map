const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const SearchHistory = require('../models/SearchHistory');
const SavedProperty = require('../models/SavedProperty');

// Get company statistics
router.get('/company-stats', protect, async (req, res) => {
  try {
    // Get all saved properties for this company
    const savedProperties = await SavedProperty.find({ 
      company: req.user.company 
    });

    // Calculate high value properties (over $1M)
    let highValueCount = 0;
    const propertyCountByOwner = {};
    const ownerValues = {};

    savedProperties.forEach(property => {
      // Check various places for market value
      const marketValue = 
        property.propertyData?.events?.assessment?.market?.mktttlvalue || 
        property.propertyData?.assessment?.market?.mktttlvalue ||
        property.propertyData?.sale?.amount?.saleamt ||
        null;
      
      if (marketValue && marketValue > 1000000) {
        highValueCount++;
      }

      // Count properties by owner
      const ownerName = property.propertyData?.owner?.owner1?.fullname || 'Unknown Owner';
      propertyCountByOwner[ownerName] = (propertyCountByOwner[ownerName] || 0) + 1;
      
      // Track actual value by owner
      if (marketValue) {
        ownerValues[ownerName] = (ownerValues[ownerName] || 0) + marketValue;
      }
    });

    // Get top 5 owners with real values
    const topOwners = Object.entries(propertyCountByOwner)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        properties: count,
        value: ownerValues[name] ? formatCurrency(ownerValues[name]) : 'N/A'
      }));

    // Calculate new properties in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newProperties = await SavedProperty.countDocuments({
      company: req.user.company,
      savedAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalProperties: savedProperties.length,
        highValueProperties: highValueCount,
        newProperties,
        topOwners,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company statistics',
      error: error.message
    });
  }
});

// Get recent company activity
router.get('/recent-activity', protect, async (req, res) => {
  try {
    // Get recent searches with user info
    const recentSearches = await SearchHistory.find({ 
      company: req.user.company 
    })
    .populate('user', 'email')
    .sort({ createdAt: -1 })
    .limit(5);

    // Get recent saved properties with user info
    const recentSaves = await SavedProperty.find({ 
      company: req.user.company 
    })
    .populate('user', 'email')
    .sort({ savedAt: -1 })
    .limit(5);

    // Combine and format activities
    const activities = [
      ...recentSearches.map(search => ({
        _id: search._id,
        type: 'search',
        action: `${search.user?.email || 'Someone'} searched for "${search.query}"`,
        timestamp: search.createdAt,
        data: search
      })),
      ...recentSaves.map(save => ({
        _id: save._id,
        type: 'save',
        action: `${save.user?.email || 'Someone'} saved ${save.propertyData?.fullAddress || save.propertyData?.address?.oneLine || 'a property'}`,
        timestamp: save.savedAt,
        data: save
      }))
    ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
});

// Helper function to format currency properly
function formatCurrency(value) {
  if (!value) return 'N/A';
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else {
    return `$${value.toLocaleString()}`;
  }
}

module.exports = router;