// Updated userDataRoutes.js for GridFS
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SearchHistory = require('../models/SearchHistory');
const SavedProperty = require('../models/SavedProperty');
const { captureStreetView } = require('../utils/streetViewCapture');

// Get user's search history
router.get('/search-history', protect, async (req, res) => {
  try {
    const searchHistory = await SearchHistory.find({
      company: req.user.company // Show all company searches, not just user's
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    // Format the searches for display - transform GridFS filenames to URLs
    const formattedSearches = searchHistory.map(search => {
      // Create URL for street view image if it exists
      const streetViewUrl = search.streetViewImage 
        ? `/api/images/streetview/${search.streetViewImage}` 
        : null;
      
      return {
        _id: search._id,
        query: search.query,
        searchType: search.searchType,
        createdAt: search.createdAt,
        user: search.user,
        propertyId: search.propertyId,
        results: search.results,
        streetViewImage: streetViewUrl
      };
    });

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

// Save user search - Decoupled from street view capture, works with GridFS
router.post('/search-history', protect, async (req, res) => {
  try {
    console.log('Received search history request:', req.body);
    console.log('User ID:', req.user.id);
    console.log('Company ID:', req.user.company);

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
      },
      streetViewImage: null // Initialize with null, will be updated asynchronously
    };

    console.log('Processed search data:', searchData);

    // Validate required fields
    if (!searchData.query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    if (!searchData.user || !searchData.company) {
      return res.status(400).json({
        success: false,
        message: 'User and company are required'
      });
    }

    // Create the search record
    const search = await SearchHistory.create(searchData);
    console.log('Search saved successfully:', search._id);
    
    // If this is a property search and has an address, trigger street view capture
    // in the background without waiting for it
    if (searchData.searchType === 'map_click' && searchData.propertyId && 
        searchData.results.properties && searchData.results.properties.length > 0) {
      
      const property = searchData.results.properties[0];
      const address = property.fullAddress || getPropertyAddress(property);
      const propertyId = searchData.propertyId;
      const searchId = search._id;
      
      // Process the street view capture in the background
      setTimeout(() => {
        processStreetViewCapture(address, propertyId, searchId)
          .catch(err => console.error('Background street view capture failed:', err));
      }, 100);
    }

    // Return immediately with the search object
    res.status(201).json({
      success: true,
      data: search
    });
  } catch (error) {
    console.error('Error saving search:', error);
    console.error('Error stack:', error.stack);
    
    // Return detailed error information
    res.status(500).json({
      success: false,
      message: 'Failed to save search',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Function to process street view capture in the background - now using GridFS
async function processStreetViewCapture(address, propertyId, searchId) {
  try {
    console.log(`Starting background street view capture for property ${propertyId}`);
    
    // Capture street view image and store in GridFS - returns the filename
    const filename = await captureStreetView(address, propertyId);
    
    if (filename) {
      // Update the search record with the filename for GridFS
      await SearchHistory.findByIdAndUpdate(searchId, { 
        streetViewImage: filename 
      });
      
      console.log(`Street view image captured and saved to GridFS for property ${propertyId}: ${filename}`);
    } else {
      console.log(`No street view image could be captured for property ${propertyId}`);
    }
  } catch (err) {
    console.error(`Error in background street view capture for property ${propertyId}:`, err);
  }
}

// Helper function to get property address from different formats
function getPropertyAddress(property) {
  if (!property) return 'Unknown Address';
  
  if (property.address?.oneLine) return property.address.oneLine;
  
  let address = '';
  if (property.address?.line1) address += property.address.line1;
  
  const parts = [];
  if (property.address?.city) parts.push(property.address.city);
  if (property.address?.state) parts.push(property.address.state);
  if (property.address?.postal1) parts.push(property.address.postal1);
  
  if (parts.length > 0) {
    address += (address ? ', ' : '') + parts.join(', ');
  }
  
  return address || 'Unknown Address';
}

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