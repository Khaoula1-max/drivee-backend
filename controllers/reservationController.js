// controllers/reservationController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une nouvelle réservation
const createReservation = async (req, res) => {
  const { studentId, schoolId, offreId, startDate, status, paymentStatus } = req.body;

  try {
    const reservation = await prisma.reservation.create({
      data: {
        studentId,
        schoolId,
        offreId,
        startDate,
        status,
        paymentStatus,
      },
    });
    res.status(201).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de la réservation' });
  }
};

// Obtenir toutes les réservations
const getAllReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany();
    res.status(200).json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
};

// Obtenir une réservation par ID
const getReservationById = async (req, res) => {
  const { id } = req.params;

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    res.status(200).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la réservation' });
  }
};
// Mettre à jour une réservation
const updateReservation = async (req, res) => {
  const { id } = req.params;
  const { startDate, status, paymentStatus } = req.body;

  try {
    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        startDate,
        status,
        paymentStatus,
      },
    });
    res.status(200).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la réservation' });
  }
};

// Supprimer une réservation
const deleteReservation = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.reservation.delete({
      where: { id },
    });
    res.status(204).send(); // No Content
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la réservation' });
  }
};

module.exports = {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
};