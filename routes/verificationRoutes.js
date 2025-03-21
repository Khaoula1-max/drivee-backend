const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

// Create a new verification
router.post('/', verificationController.createVerification);

// Get all verifications
router.get('/', verificationController.getAllVerifications);

// Approve a verification
router.put('/:id', verificationController.approveVerification);

// Reject a verification
router.delete('/:id', verificationController.rejectVerification);

module.exports = router;