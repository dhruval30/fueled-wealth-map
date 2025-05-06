// controllers/userController.js
const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    console.log('Get all users request received');
    console.log('User making request:', req.user.id);
    console.log('Company ID from request:', req.user.company);
    
    // Find all users that belong to the same company as the requester
    const users = await User.find({ 
      company: req.user.company
    }).select('-password');
    
    console.log(`Found ${users.length} users for company ${req.user.company}`);
    console.log('User IDs found:', users.map(user => user._id));
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};