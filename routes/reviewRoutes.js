const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authenticateJWT = require('../middlewares/authMiddleware');

// Ajouter une review (authentifié)
router.post('/', authenticateJWT, reviewController.addReview);

// Afficher les reviews d'une offre (public)
router.get('/:offreId', reviewController.getOffreReviews);

module.exports = router;