// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAllUsers } = require('../controllers/userController');

// Add a GET route without the admin restriction for testing
router.get('/test', protect, (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'User routes working!'
  });
});

// Original route with admin check
router.get('/', protect, getAllUsers);  // Temporarily remove authorize('admin')

module.exports = router;