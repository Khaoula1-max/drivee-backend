
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ReservationController {
  // Ajouter une nouvelle réservation
  async ajouterReservation(req, res) {
    const { studentId, schoolId, offreId, startDate } = req.body;

    try {
      const reservation = await prisma.reservation.create({
        data: {
          studentId,
          schoolId,
          offreId,
          startDate,
          status: 'pending',
          paymentStatus: 'unpaid',
        },
      });
      res.status(201).json(reservation);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de l\'ajout de la réservation' });
    }
  }
}


module.exports = new ReservationController();