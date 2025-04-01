const express = require('express');
const router = express.Router();
const { createOffre, updateOffre, deleteOffre, getAllOffres } = require('../controllers/offreController');
const authenticateJWT = require('../middlewares/authMiddleware');

// Récupérer toutes les offres
router.get('/', getAllOffres);

// Ajouter une offre (authentification requise)
router.post('/', authenticateJWT, createOffre); 

// Modifier une offre (authentification requise)
router.put('/:id', authenticateJWT, updateOffre);

// Supprimer une offre (authentification requise)
router.delete('/:id', authenticateJWT, deleteOffre);

module.exports = router;