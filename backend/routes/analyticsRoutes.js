const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const SearchHistory = require('../models/SearchHistory');
const SavedProperty = require('../models/SavedProperty');
const WealthEstimation = require('../models/WealthEstimation');

// Get company statistics (FIXED to include averageValue)
router.get('/company-stats', protect, async (req, res) => {
  try {
    const savedProperties = await SavedProperty.find({ 
      company: req.user.company 
    });

    let highValueCount = 0;
    let totalValue = 0;
    let propertiesWithValue = 0;
    const propertyCountByOwner = {};
    const ownerValues = {};

    savedProperties.forEach(property => {
      const marketValue = 
        property.propertyData?.events?.assessment?.market?.mktttlvalue || 
        property.propertyData?.assessment?.market?.mktttlvalue ||
        property.propertyData?.sale?.amount?.saleamt ||
        null;
      
      if (marketValue && typeof marketValue === 'number' && marketValue > 0) {
        totalValue += marketValue;
        propertiesWithValue++;
        
        if (marketValue > 1000000) {
          highValueCount++;
        }
      }

      const ownerName = property.propertyData?.owner?.owner1?.fullname || 'Unknown Owner';
      propertyCountByOwner[ownerName] = (propertyCountByOwner[ownerName] || 0) + 1;
      
      if (marketValue) {
        ownerValues[ownerName] = (ownerValues[ownerName] || 0) + marketValue;
      }
    });

    // Calculate average value
    const averageValue = propertiesWithValue > 0 ? Math.round(totalValue / propertiesWithValue) : 0;

    const topOwners = Object.entries(propertyCountByOwner)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        properties: count,
        value: ownerValues[name] ? formatCurrency(ownerValues[name]) : 'N/A'
      }));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newProperties = await SavedProperty.countDocuments({
      company: req.user.company,
      savedAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalProperties: savedProperties.length,
        averageValue: averageValue, // NOW INCLUDED
        highValueProperties: highValueCount,
        newProperties,
        propertiesWithValue, // Additional useful metric
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

// IMPROVED: Get property value distribution with better value extraction
router.get('/property-value-distribution', protect, async (req, res) => {
  try {
    const savedProperties = await SavedProperty.find({ 
      company: req.user.company 
    });

    const valueRanges = {
      'Under $500K': 0,
      '$500K - $1M': 0,
      '$1M - $2M': 0,
      '$2M - $5M': 0,
      '$5M - $10M': 0,
      'Over $10M': 0,
      'Unknown': 0
    };

    savedProperties.forEach(property => {
      // More comprehensive value extraction
      const marketValue = extractPropertyValue(property);

      if (!marketValue || marketValue <= 0) {
        valueRanges['Unknown']++;
      } else if (marketValue < 500000) {
        valueRanges['Under $500K']++;
      } else if (marketValue < 1000000) {
        valueRanges['$500K - $1M']++;
      } else if (marketValue < 2000000) {
        valueRanges['$1M - $2M']++;
      } else if (marketValue < 5000000) {
        valueRanges['$2M - $5M']++;
      } else if (marketValue < 10000000) {
        valueRanges['$5M - $10M']++;
      } else {
        valueRanges['Over $10M']++;
      }
    });

    const chartData = Object.entries(valueRanges).map(([range, count]) => ({
      name: range,
      value: count,
      percentage: savedProperties.length > 0 ? ((count / savedProperties.length) * 100).toFixed(1) : 0
    }));

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching property value distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property value distribution',
      error: error.message
    });
  }
});

// NEW: Get property types distribution
router.get('/property-types', protect, async (req, res) => {
  try {
    const savedProperties = await SavedProperty.find({ 
      company: req.user.company 
    });

    const typeCount = {};
    
    savedProperties.forEach(property => {
      const propertyType = 
        property.propertyData?.summary?.propclass || 
        property.propertyData?.summary?.proptype ||
        property.propertyData?.building?.summary?.propclass ||
        'Unknown';
      
      typeCount[propertyType] = (typeCount[propertyType] || 0) + 1;
    });

    const chartData = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .map(([type, count]) => ({
        name: type,
        value: count,
        percentage: savedProperties.length > 0 ? ((count / savedProperties.length) * 100).toFixed(1) : 0
      }));

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching property types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property types',
      error: error.message
    });
  }
});

// NEW: Get geographic distribution
router.get('/geographic-distribution', protect, async (req, res) => {
  try {
    const savedProperties = await SavedProperty.find({ 
      company: req.user.company 
    });

    const stateCount = {};
    const cityCount = {};
    
    savedProperties.forEach(property => {
      const state = 
        property.propertyData?.address?.countrySubd || 
        property.propertyData?.address?.state ||
        'Unknown';
      
      const city = 
        property.propertyData?.address?.city ||
        property.propertyData?.address?.locality ||
        'Unknown';
      
      stateCount[state] = (stateCount[state] || 0) + 1;
      cityCount[city] = (cityCount[city] || 0) + 1;
    });

    const stateData = Object.entries(stateCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([state, count]) => ({
        name: state,
        properties: count,
        percentage: savedProperties.length > 0 ? ((count / savedProperties.length) * 100).toFixed(1) : 0
      }));

    const cityData = Object.entries(cityCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({
        name: city,
        properties: count,
        percentage: savedProperties.length > 0 ? ((count / savedProperties.length) * 100).toFixed(1) : 0
      }));

    res.status(200).json({
      success: true,
      data: {
        states: stateData,
        cities: cityData
      }
    });
  } catch (error) {
    console.error('Error fetching geographic distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geographic distribution',
      error: error.message
    });
  }
});

// NEW: Get activity trends over time
router.get('/activity-trends', protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get searches by day
    const searches = await SearchHistory.aggregate([
      {
        $match: {
          company: req.user.company,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          searches: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get saved properties by day
    const saves = await SavedProperty.aggregate([
      {
        $match: {
          company: req.user.company,
          savedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$savedAt" }
          },
          saves: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Create a complete date range
    const dateRange = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateRange.push(date.toISOString().split('T')[0]);
    }

    // Merge data
    const chartData = dateRange.map(date => {
      const searchData = searches.find(s => s._id === date);
      const saveData = saves.find(s => s._id === date);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        searches: searchData ? searchData.searches : 0,
        saves: saveData ? saveData.saves : 0
      };
    });

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching activity trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity trends',
      error: error.message
    });
  }
});

// NEW: Get wealth distribution analytics
router.get('/wealth-analytics', protect, async (req, res) => {
  try {
    const wealthEstimations = await WealthEstimation.find({
      company: req.user.company
    });

    if (wealthEstimations.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          distribution: [],
          confidence: [],
          averageWealth: 0,
          totalEstimations: 0
        }
      });
    }

    // Wealth distribution ranges
    const wealthRanges = {
      'Under $1M': 0,
      '$1M - $5M': 0,
      '$5M - $10M': 0,
      '$10M - $25M': 0,
      '$25M - $50M': 0,
      'Over $50M': 0
    };

    // Confidence levels
    const confidenceLevels = {
      'High': 0,
      'Medium': 0,
      'Low': 0
    };

    let totalWealth = 0;

    wealthEstimations.forEach(estimation => {
      const wealth = estimation.estimatedNetWorth || 0;
      totalWealth += wealth;

      // Categorize by wealth range
      if (wealth < 1000000) {
        wealthRanges['Under $1M']++;
      } else if (wealth < 5000000) {
        wealthRanges['$1M - $5M']++;
      } else if (wealth < 10000000) {
        wealthRanges['$5M - $10M']++;
      } else if (wealth < 25000000) {
        wealthRanges['$10M - $25M']++;
      } else if (wealth < 50000000) {
        wealthRanges['$25M - $50M']++;
      } else {
        wealthRanges['Over $50M']++;
      }

      // Count confidence levels
      confidenceLevels[estimation.confidence] = (confidenceLevels[estimation.confidence] || 0) + 1;
    });

    const distributionData = Object.entries(wealthRanges).map(([range, count]) => ({
      name: range,
      value: count,
      percentage: wealthEstimations.length > 0 ? ((count / wealthEstimations.length) * 100).toFixed(1) : 0
    }));

    const confidenceData = Object.entries(confidenceLevels).map(([level, count]) => ({
      name: level,
      value: count,
      percentage: wealthEstimations.length > 0 ? ((count / wealthEstimations.length) * 100).toFixed(1) : 0
    }));

    const averageWealth = wealthEstimations.length > 0 ? totalWealth / wealthEstimations.length : 0;

    res.status(200).json({
      success: true,
      data: {
        distribution: distributionData,
        confidence: confidenceData,
        averageWealth: Math.round(averageWealth),
        totalEstimations: wealthEstimations.length
      }
    });
  } catch (error) {
    console.error('Error fetching wealth analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wealth analytics',
      error: error.message
    });
  }
});

// NEW: Get search patterns analytics
router.get('/search-patterns', protect, async (req, res) => {
  try {
    const searches = await SearchHistory.find({
      company: req.user.company
    }).sort({ createdAt: -1 }).limit(1000);

    // Search types distribution
    const searchTypes = {};
    searches.forEach(search => {
      const type = search.searchType || 'unknown';
      searchTypes[type] = (searchTypes[type] || 0) + 1;
    });

    const searchTypeData = Object.entries(searchTypes).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count,
      percentage: searches.length > 0 ? ((count / searches.length) * 100).toFixed(1) : 0
    }));

    // Hour of day analysis
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      searches: 0
    }));

    searches.forEach(search => {
      const hour = new Date(search.createdAt).getHours();
      hourlyData[hour].searches++;
    });

    res.status(200).json({
      success: true,
      data: {
        searchTypes: searchTypeData,
        hourlyPattern: hourlyData
      }
    });
  } catch (error) {
    console.error('Error fetching search patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search patterns',
      error: error.message
    });
  }
});

// ENHANCED: Helper function to extract property value from various data structures
function extractPropertyValue(property) {
  // Try multiple possible paths for property value
  const possiblePaths = [
    property.propertyData?.events?.assessment?.market?.mktttlvalue,
    property.propertyData?.assessment?.market?.mktttlvalue,
    property.propertyData?.sale?.amount?.saleamt,
    property.propertyData?.valuation?.marketValue,
    property.propertyData?.value?.market,
    property.propertyData?.assessedValue,
    property.propertyData?.marketValue,
    property.marketValue,
    property.value
  ];

  for (const value of possiblePaths) {
    if (value && typeof value === 'number' && value > 0) {
      return value;
    }
    // Handle string values that might be formatted as currency
    if (typeof value === 'string') {
      const numericValue = parseFloat(value.replace(/[\$,]/g, ''));
      if (!isNaN(numericValue) && numericValue > 0) {
        return numericValue;
      }
    }
  }

  return null;
}

// Helper function for currency formatting
function formatCurrency(value) {
  if (!value || value <= 0) return 'N/A';
  
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else {
    return `$${value.toLocaleString()}`;
  }
}

module.exports = router;