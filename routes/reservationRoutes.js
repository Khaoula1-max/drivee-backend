

const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authenticateJWT = require('../middlewares/authMiddleware');

// Utiliser le middleware d'authentification pour toutes les routes de réservation
router.use(authenticateJWT);

// Route pour créer une nouvelle réservation
router.post('/reservations', reservationController.createReservation);

// Route pour obtenir toutes les réservations
router.get('/reservations', reservationController.getAllReservations);

// Route pour obtenir une réservation par ID
router.get('/reservations/:id', reservationController.getReservationById);

// Route pour mettre à jour une réservation
router.put('/reservations/:id', reservationController.updateReservation);

// Route pour supprimer une réservation
router.delete('/reservations/:id', reservationController.deleteReservation);

module.exports = router;