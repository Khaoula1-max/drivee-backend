const express = require('express');
const {
  createVerification,
  getAllVerifications,
  getVerificationById,
  updateVerification,
  deleteVerification,
} = require('../controllers/verificationController');

const router = express.Router();

// Routes pour les vérifications
router.post('/', createVerification);
router.get('/', getAllVerifications);
router.get('/:id', getVerificationById);
router.put('/:id', updateVerification);
router.delete('/:id', deleteVerification);

module.exports = router;