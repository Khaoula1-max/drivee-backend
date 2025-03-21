// controllers/offreController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une nouvelle offre
const createOffre = async (req, res) => {
  const { schoolId, title, description, price, durationHours, startDate, endDate, locationId } = req.body;

  try {
    const offre = await prisma.offre.create({
      data: {
        schoolId,
        title,
        description,
        price,
        durationHours,
        startDate,
        endDate,
        locationId,
      },
    });
    res.status(201).json(offre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'offre' });
  }
};

// Obtenir toutes les offres
const getAllOffres = async (req, res) => {
  try {
    const offres = await prisma.offre.findMany();
    res.status(200).json(offres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des offres' });
  }
};

// Obtenir une offre par ID
const getOffreById = async (req, res) => {
  const { id } = req.params;

  try {
    const offre = await prisma.offre.findUnique({
      where: { id: parseInt(id) }, // Assurez-vous que l'ID est un nombre
    });
    if (!offre) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    res.status(200).json(offre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'offre' });
  }
};

// Mettre à jour une offre
const updateOffre = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, durationHours, startDate, endDate, locationId } = req.body;

  try {
    const offre = await prisma.offre.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        price,
        durationHours,
        startDate,
        endDate,
        locationId,
      },
    });
    res.status(200).json(offre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'offre' });
  }
};

// Supprimer une offre
const deleteOffre = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.offre.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send(); // No Content
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'offre' });
  }
};

// Exporter les fonctions
module.exports = {
  createOffre,
  getAllOffres,
  getOffreById,
  updateOffre,
  deleteOffre,
};