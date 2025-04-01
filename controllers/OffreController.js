
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Ajouter une offre
const createOffre = async (req, res) => {
  try {
    const { schoolId, title, description, price, durationHours, startDate, endDate, locationId } = req.body;

    const newOffre = await prisma.offre.create({
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

    return res.status(201).json(newOffre);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la création de l\'offre.' });
  }
};

// Modifier une offre
const updateOffre = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, durationHours, startDate, endDate, locationId } = req.body;

  try {
    const updatedOffre = await prisma.offre.update({
      where: { id },
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

    return res.status(200).json(updatedOffre);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'offre.' });
  }
};

// Supprimer une offre
const deleteOffre = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.offre.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Offre supprimée avec succès.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la suppression de l\'offre.' });
  }
};

// Récupérer toutes les offres
const getAllOffres = async (req, res) => {
    try {
      const offres = await prisma.offre.findMany();
      return res.status(200).json(offres);
    } catch (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des offres.' });
    }
  };
  
  module.exports = { createOffre, updateOffre, deleteOffre, getAllOffres }; 	
