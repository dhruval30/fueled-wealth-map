const express = require('express');
const router = express.Router();
const { 
  login, 
  getMe, 
  acceptInvitation 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/accept-invitation', acceptInvitation);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;