// routes/offreRoutes.js

const express = require('express');
const router = express.Router();
const offreController = require('../controllers/offreController');
const authenticateJWT = require('../middlewares/authMiddleware');

// Utiliser le middleware d'authentification pour les routes de création, mise à jour et suppression
router.use(authenticateJWT);

// Route pour créer une nouvelle offre
router.post('/offres', offreController.createOffre);

// Route pour obtenir toutes les offres
router.get('/offres', offreController.getAllOffres);

// Route pour obtenir une offre par ID
router.get('/offres/:id', offreController.getOffreById);

// Route pour mettre à jour une offre
router.put('/offres/:id', offreController.updateOffre);

// Route pour supprimer une offre
router.delete('/offres/:id', offreController.deleteOffre);

module.exports = router;