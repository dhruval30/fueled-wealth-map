const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Company = require('../models/Company');
const crypto = require('crypto');

const { sendInvitationEmail } = require('../utils/emailService');

// @desc    Invite employee
// @route   POST /api/invitations
// @access  Private (Admin)
exports.inviteEmployee = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findOne({
      email,
      company: req.user.company,
      status: 'pending'
    });
    
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'There is already a pending invitation for this email'
      });
    }
    
    // Generate unique token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Create invitation
    const invitation = new Invitation({
      email,
      company: req.user.company,
      invitedBy: req.user.id,
      role: role || 'viewer',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await invitation.save();
    
    // Get company name for the email
    const company = await Company.findById(req.user.company);
    
    // Send invitation email
    try {
      const emailResult = await sendInvitationEmail(email, {
        token,
        companyName: company.name,
        role: role || 'viewer',
        invitedByEmail: req.user.email
      });
      
      if (!emailResult.success) {
        console.warn(`Email could not be sent, but invitation was created: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.error('Error in email sending:', emailError);
      // Continue with the invitation process even if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitationId: invitation._id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Invite employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all invitations for a company
// @route   GET /api/invitations
// @access  Private (Admin)
exports.getInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      company: req.user.company
    }).populate('invitedBy', 'email');
    
    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel invitation
// @route   DELETE /api/invitations/:id
// @access  Private (Admin)
exports.cancelInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    // Check if user belongs to this company
    if (req.user.company.toString() !== invitation.company.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this invitation'
      });
    }
    
    // Replace invitation.remove() with the newer method
    await Invitation.deleteOne({ _id: invitation._id });
    
    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Validate invitation token
// @route   GET /api/invitations/validate/:token
// @access  Public
exports.validateInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Find invitation by token
    const invitation = await Invitation.findOne({ token })
      .populate('company', 'name');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation token'
      });
    }
    
    // Check if invitation has expired
    if (invitation.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }
    
    // Check if invitation has already been used
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invitation has already been used'
      });
    }
    
    res.status(200).json({
      success: true,
      email: invitation.email,
      role: invitation.role,
      companyName: invitation.company.name,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getCompanyTeam = async (req, res) => {
  try {
    const companyId = req.user.company;
    
    console.log('Getting team for company:', companyId);
    
    // Get accepted invitations for this company
    const acceptedInvitations = await Invitation.find({
      company: companyId,
      status: 'accepted'
    }).populate('user', '-password');
    
    // Get all active users for this company
    const users = await User.find({
      company: companyId,
      isActive: true
    }).select('-password');
    
    console.log(`Found ${users.length} active users for company`);
    
    // Combine the data
    const teamMembers = users.map(user => ({
      _id: user._id,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin || null,
      createdAt: user.createdAt
    }));
    
    res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers
    });
  } catch (error) {
    console.error('Error getting company team:', error);
    res.status(500).json({
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};