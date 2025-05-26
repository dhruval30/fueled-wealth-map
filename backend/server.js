// Update to server.js for GridFS support
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');
const { initGridFS } = require('./utils/gridfsStorage');
const wealthRoutes = require('./routes/wealthRoutes');
const reportRoutes = require('./routes/reportRoutes');


// Load env vars
dotenv.config();

// Connect to database
connectDB().then(() => {
  // Initialize GridFS after database connection
  initGridFS().catch(err => {
    console.error('Error initializing GridFS:', err);
  });
});

// Import models to ensure they're registered
require('./models/User');
require('./models/Company');
require('./models/Invitation');
require('./models/SearchHistory');
require('./models/SavedProperty');
require('./models/WealthEstimation');
require('./models/Report');

// Route files
const companyRoutes = require('./routes/companyRoutes');
const authRoutes = require('./routes/authRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const userRoutes = require('./routes/userRoutes');
const userDataRoutes = require('./routes/userDataRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const imageRoutes = require('./routes/imageRoutes');  // New image routes for GridFS

const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoints
app.get('/api/test', (req, res) => {
  return res.status(200).json({ 
    message: 'Test endpoint working!',
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

// Set static folder for uploads - still keep for other files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/companies', companyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userDataRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/images', imageRoutes);  // Mount the new image routes
app.use('/api/wealth', wealthRoutes);
app.use('/api/reports', reportRoutes);

// Test endpoint for new routes
app.get('/api/routes-test', (req, res) => {
  res.json({
    message: 'New routes mounted successfully',
    routes: [
      '/api/user/search-history',
      '/api/user/saved-properties', 
      '/api/analytics/company-stats',
      '/api/analytics/recent-activity',
      '/api/analytics/export',
      '/api/images/streetview/:filename'  // New image route
    ]
  });
});

// Debug routes for development
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/street-view/:address/:propertyId', async (req, res) => {
    try {
      const { captureStreetView } = require('./utils/streetViewCapture');
      const { address, propertyId } = req.params;
      
      console.log(`Debug: Testing street view capture for address ${address} and property ID ${propertyId}`);
      
      const filename = await captureStreetView(decodeURIComponent(address), propertyId);
      
      if (filename) {
        res.json({
          success: true,
          message: 'Street view image captured successfully',
          filename,
          url: `/api/images/streetview/${filename}`
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'No street view image could be captured',
          address: decodeURIComponent(address)
        });
      }
    } catch (error) {
      console.error('Debug route error:', error);
      res.status(500).json({
        success: false,
        message: 'Error capturing street view',
        error: error.message
      });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Available routes:`);
  console.log(`- /api/user/search-history`);
  console.log(`- /api/user/saved-properties`);
  console.log(`- /api/analytics/company-stats`);
  console.log(`- /api/analytics/recent-activity`);
  console.log(`- /api/images/streetview/:filename`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });

  // Optional: close DB / browser connections if needed
  // await mongoose.disconnect(); or mongoClient.close()
});


// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});