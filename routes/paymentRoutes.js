const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route pour créer un paiement
router.post(
  '/create-payment-intent',
  authMiddleware,
  controller.createPaymentIntent
);

// Route pour l'historique des paiements
router.get(
  '/history',
  authMiddleware,
  controller.getPaymentHistory
);

// Webhook Stripe (ne pas protéger par authMiddleware)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  controller.handleWebhook
);

module.exports = router;