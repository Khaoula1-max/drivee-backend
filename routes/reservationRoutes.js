const express = require('express');
const {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
} = require('../controllers/reservationController');

const router = express.Router();

// Routes pour les réservations
router.post('/', createReservation);
router.get('/', getAllReservations);
router.get('/:id', getReservationById);
router.put('/:id', updateReservation);
router.delete('/:id', deleteReservation);

module.exports = router;