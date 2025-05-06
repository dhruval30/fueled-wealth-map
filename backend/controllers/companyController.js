const Company = require('../models/Company');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Register a new company and create admin user
// @route   POST /api/companies
// @access  Public
exports.registerCompany = async (req, res) => {
  try {
    console.log('Registration request received');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    // Access fields directly from req.body
    const companyName = req.body.companyName;
    const email = req.body.email;
    const password = req.body.password;
    
    if (!companyName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: company name, email, or password'
      });
    }
    
    // Check if user email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Create new company
    let company = new Company({
      name: companyName
    });
    
    // Handle logo upload if exists
    if (req.file) {
      company.logo = `/uploads/logos/${req.file.filename}`;
    }
    
    await company.save();
    console.log('Company saved:', company);
    
    // Create admin user
    const user = new User({
      email,
      password,
      company: company._id,
      role: 'admin' // First user is always admin
    });
    
    await user.save();
    console.log('User saved:', { email: user.email, role: user.role });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback_secret_for_development',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      companyId: company._id,
      token
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get company details
// @route   GET /api/companies/:id
// @access  Private (Admin)
exports.getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Check if user belongs to this company
    if (req.user.company.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this company'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update company details
// @route   PUT /api/companies/:id
// @access  Private (Admin)
exports.updateCompany = async (req, res) => {
  try {
    let company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Check if user belongs to this company and is admin
    if (
      req.user.company.toString() !== company._id.toString() ||
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this company'
      });
    }
    
    // Handle fields to update
    if (req.body.companyName) {
      company.name = req.body.companyName;
    }
    
    // Handle logo upload
    if (req.file) {
      // Delete old logo if exists
      if (company.logo) {
        const oldLogoPath = path.join(__dirname, '..', 'public', company.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      
      // Set new logo
      company.logo = `/uploads/logos/${req.file.filename}`;
    }
    
    // Handle data access preferences
    if (req.body.dataAccessPreferences) {
      company.dataAccessPreferences = {
        ...company.dataAccessPreferences,
        ...req.body.dataAccessPreferences
      };
    }
    
    await company.save();
    
    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};