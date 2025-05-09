const express = require('express');
const router = express.Router();
const { 
  inviteEmployee, 
  getInvitations, 
  cancelInvitation,
  validateInvitation
} = require('../controllers/invitationController');
const { protect, authorize } = require('../middleware/auth');
const invitationController = require('../controllers/invitationController');
router.get('/company-team', protect, invitationController.getCompanyTeam);

// Public routes
router.get('/validate/:token', validateInvitation);
router.get('/company-team', protect, invitationController.getCompanyTeam);


// Protected routes
router.post('/', protect, authorize('admin'), inviteEmployee);
router.get('/', protect, authorize('admin'), getInvitations);
router.delete('/:id', protect, authorize('admin'), cancelInvitation);

module.exports = router;