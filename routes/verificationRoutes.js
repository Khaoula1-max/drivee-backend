const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, verificationController.submitVerification);
router.get('/', authMiddleware, verificationController.getAllVerifications);

module.exports = router;