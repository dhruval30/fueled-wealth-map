const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Invitation = require('../models/Invitation');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Don't use lean() here as we need the document methods
    const user = await User.findOne({ email }).select('+password');
    
    // Early failure for non-existent user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }
    
    // Check password match
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login as a background operation
    const userId = user._id;
    // Use a non-awaited update
    User.updateOne({ _id: userId }, { lastLogin: Date.now() }).exec()
      .catch(err => console.error('Error updating last login:', err));
    
    // Generate JWT token
    const token = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'fallback_secret_for_development',
      { expiresIn: '30d' }
    );
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: userId,
        email: user.email,
        role: user.role,
        companyId: user.company
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Accept invitation and create account
// @route   POST /api/auth/accept-invitation
// @access  Public
exports.acceptInvitation = async (req, res) => {
  try {
    const { token: invitationToken, password } = req.body;
    
    // Find invitation - use invitationToken instead of token
    const invitation = await Invitation.findOne({ token: invitationToken, status: 'pending' });
    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }
    
    // Create user
    const user = new User({
      email: invitation.email,
      password,
      company: invitation.company,
      role: invitation.role,
      isActive: true
    });
    
    await user.save();
    console.log('Created new user:', user._id);
    
    // Update invitation with reference to the user
    invitation.status = 'accepted';
    invitation.user = user._id;
    await invitation.save();
    console.log('Updated invitation with user reference');
    
    // Create JWT token - use a different variable name
    const authToken = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        companyId: user.company
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('company', 'name logo');
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        company: {
          id: user.company._id,
          name: user.company.name,
          logo: user.company.logo
        },
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};