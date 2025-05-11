const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SearchHistory = require('../models/SearchHistory');
const SavedProperty = require('../models/SavedProperty');

// Get user's search history
router.get('/search-history', protect, async (req, res) => {
  try {
    const searchHistory = await SearchHistory.find({
      company: req.user.company // Show all company searches, not just user's
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    // Format the searches for display
    const formattedSearches = searchHistory.map(search => ({
      _id: search._id,
      query: search.query,
      searchType: search.searchType,
      createdAt: search.createdAt,
      user: search.user,
      propertyId: search.propertyId,
      results: search.results
    }));

    res.status(200).json({
      success: true,
      count: formattedSearches.length,
      data: formattedSearches
    });
  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search history',
      error: error.message
    });
  }
});

// Save user search
router.post('/search-history', protect, async (req, res) => {
  try {
    const searchData = {
      user: req.user.id,
      company: req.user.company,
      query: req.body.query,
      searchType: req.body.searchType || 'text_search',
      propertyId: req.body.propertyId,
      filters: req.body.filters || {},
      results: {
        count: req.body.results?.count || 0,
        properties: req.body.results?.properties || []
      }
    };

    const search = await SearchHistory.create(searchData);

    console.log('Search saved:', searchData);

    res.status(201).json({
      success: true,
      data: search
    });
  } catch (error) {
    console.error('Error saving search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save search',
      error: error.message
    });
  }
});

// Get user's saved properties
router.get('/saved-properties', protect, async (req, res) => {
  try {
    const savedProperties = await SavedProperty.find({
      company: req.user.company // Show all company saved properties
    })
    .sort({ savedAt: -1 })
    .lean();

    // Format the properties for display
    const formattedProperties = savedProperties.map(property => ({
      _id: property._id,
      attomId: property.attomId,
      propertyData: property.propertyData,
      savedAt: property.savedAt,
      user: property.user,
      notes: property.notes,
      tags: property.tags,
      address: property.propertyData?.fullAddress || property.propertyData?.address?.oneLine || 'Unknown Address',
      value: property.propertyData?.events?.assessment?.market?.mktttlvalue || 
             property.propertyData?.assessment?.market?.mktttlvalue
    }));

    res.status(200).json({
      success: true,
      count: formattedProperties.length,
      data: formattedProperties
    });
  } catch (error) {
    console.error('Error fetching saved properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved properties',
      error: error.message
    });
  }
});

// Save a property
router.post('/saved-properties', protect, async (req, res) => {
  try {
    const propertyData = {
      user: req.user.id,
      company: req.user.company,
      attomId: req.body.identifier?.attomId || req.body.attomId,
      propertyData: req.body,
      notes: req.body.notes || '',
      tags: req.body.tags || []
    };

    // Check if property is already saved
    const existingProperty = await SavedProperty.findOne({
      company: req.user.company,
      attomId: propertyData.attomId
    });

    if (existingProperty) {
      return res.status(400).json({
        success: false,
        message: 'Property already saved'
      });
    }

    const savedProperty = await SavedProperty.create(propertyData);

    console.log('Property saved:', propertyData);

    res.status(201).json({
      success: true,
      data: savedProperty
    });
  } catch (error) {
    console.error('Error saving property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save property',
      error: error.message
    });
  }
});

// Delete a saved property
router.delete('/saved-properties/:id', protect, async (req, res) => {
  try {
    const savedProperty = await SavedProperty.findById(req.params.id);

    if (!savedProperty) {
      return res.status(404).json({
        success: false,
        message: 'Saved property not found'
      });
    }

    // Check if user is from the same company
    if (savedProperty.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this property'
      });
    }

    await SavedProperty.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saved property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error.message
    });
  }
});

module.exports = router;