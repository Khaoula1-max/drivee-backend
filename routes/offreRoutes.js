const express = require('express');
const router = express.Router();
const offreController = require('../controllers/offreController');
const authenticateJWT = require('../middlewares/authMiddleware');
const { isSchool } = require('../middlewares/roleMiddleware');

// Créer une offre (réservé aux écoles)
router.post('/', authenticateJWT, isSchool, offreController.createOffre);


// Lister les offres (public)
router.get('/', offreController.getAllOffres);

// Modifier/supprimer (réservé à l'école propriétaire ou admin)
router.put('/:id', authenticateJWT, offreController.updateOffre);
router.delete('/:id', authenticateJWT, offreController.deleteOffre);

module.exports = router;