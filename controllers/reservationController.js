const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une réservation (pour étudiants)
exports.createReservation = async (req, res) => {
  try {
    const { offreId, startDate, status, paymentStatus } = req.body;

    const reservation = await prisma.reservation.create({
      data: {
        studentId: req.user.id, 
        schoolId: req.body.schoolId, 
        offreId,
        startDate: new Date(startDate),
        status: status || 'pending',
        paymentStatus: paymentStatus || 'unpaid',
      },
    });
    res.status(201).json(reservation);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

// Lister les réservations d'un étudiant
exports.getUserReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { studentId: req.user.id },
      include: {
        offre: true,
        school: true
      }
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getSchoolReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { 
        schoolId: req.user.id 
      },
      include: {
        student: true,
        offre: true,
        school: true
      },
      orderBy: {
        reservationDate: 'desc'
      }
    });
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: "Server error" });
  }
};