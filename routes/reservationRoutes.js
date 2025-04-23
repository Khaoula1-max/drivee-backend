const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');
// Protégé par authMiddleware 
router.post('/', authMiddleware, reservationController.createReservation);
router.get('/all-reservations', authMiddleware, reservationController.getAllReservations);
router.get('/my-reservations', authMiddleware, reservationController.getUserReservations);
router.get('/school', authMiddleware, reservationController.getSchoolReservations); // Add this line

module.exports = router;