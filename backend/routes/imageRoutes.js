// Complete imageRoutes.js file with status tracking
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { downloadFile, fileExists } = require('../utils/gridfsStorage');
const SearchHistory = require('../models/SearchHistory');
const { captureStreetView } = require('../utils/streetViewCapture');

// Serve street view images from GridFS
router.get('/streetview/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Check if the file exists
    const exists = await fileExists(filename);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Download the file from GridFS
    const imageBuffer = await downloadFile(filename, false); // false because we're using filename, not ID
    
    // Set the content type
    res.set('Content-Type', 'image/png');
    
    // Send the image
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error serving image from GridFS:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Check if a street view image is being processed
router.get('/streetview-status/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const filename = `streetview_${propertyId}.png`;
    
    // Check if the file exists in GridFS
    const exists = await fileExists(filename);
    
    if (exists) {
      // File exists, return success
      res.json({
        status: 'complete',
        filename,
        url: `/api/images/streetview/${filename}`
      });
      return;
    }
    
    // Check if there's a processing record in the database
    const processing = await mongoose.connection.db.collection('streetview_processing').findOne({
      propertyId: propertyId.toString()
    });
    
    if (processing && processing.status === 'processing') {
      // Still processing
      const startedAt = processing.startedAt || new Date(Date.now() - 5000);
      const elapsedMs = Date.now() - startedAt.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      
      res.json({
        status: 'processing',
        startedAt,
        elapsedSeconds,
        estimatedTimeRemaining: Math.max(0, 30 - elapsedSeconds) // Assume 30 seconds total
      });
      return;
    }
    
    // Check the search history for this property
    const search = await SearchHistory.findOne({ propertyId: parseInt(propertyId) || propertyId });
    
    if (search && search.streetViewImage) {
      // Image exists in search history
      res.json({
        status: 'complete',
        filename: search.streetViewImage,
        url: `/api/images/streetview/${search.streetViewImage}`
      });
      return;
    }
    
    // No image exists and none is being processed
    res.json({
      status: 'not_found'
    });
  } catch (error) {
    console.error('Error checking street view status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// Trigger an immediate street view capture
router.post('/capture-streetview', async (req, res) => {
  try {
    const { address, propertyId } = req.body;
    
    if (!address || !propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Address and propertyId are required'
      });
    }
    
    // Start the capture process
    const filename = await captureStreetView(address, propertyId);
    
    if (filename) {
      res.json({
        success: true,
        message: 'Street view capture completed successfully',
        filename,
        url: `/api/images/streetview/${filename}`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Failed to capture street view',
        address
      });
    }
  } catch (error) {
    console.error('Error in street view capture route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get a list of recent street view captures
router.get('/recent-streetviews', async (req, res) => {
  try {
    // Get recent searches with street view images
    const recentSearches = await SearchHistory.find({
      streetViewImage: { $ne: null }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    
    // Format the results
    const recentStreetViews = recentSearches.map(search => ({
      propertyId: search.propertyId,
      address: search.query.replace('Property at ', ''),
      capturedAt: search.createdAt,
      imageUrl: `/api/images/streetview/${search.streetViewImage}`
    }));
    
    res.json({
      success: true,
      count: recentStreetViews.length,
      data: recentStreetViews
    });
  } catch (error) {
    console.error('Error fetching recent street views:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get current processing status
router.get('/processing-status', async (req, res) => {
  try {
    // Get all processing jobs
    const processing = await mongoose.connection.db.collection('streetview_processing')
      .find({ status: 'processing' })
      .toArray();
    
    res.json({
      success: true,
      count: processing.length,
      data: processing
    });
  } catch (error) {
    console.error('Error fetching processing status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;