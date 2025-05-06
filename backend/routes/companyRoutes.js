const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  registerCompany, 
  getCompanyDetails, 
  updateCompany 
} = require('../controllers/companyController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up storage for company logos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/logos/');
  },
  filename: function(req, file, cb) {
    cb(
      null,
      `company-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

// File filter - only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Add a test endpoint
router.get('/test', (req, res) => {
  res.status(200).json({ success: true, message: 'Company routes working!' });
});

// Public routes
router.post('/', upload.single('logo'), registerCompany);

// Protected routes
router.get('/:id', protect, getCompanyDetails);
router.put(
  '/:id', 
  protect, 
  authorize('admin'), 
  upload.single('logo'), 
  updateCompany
);

module.exports = router;