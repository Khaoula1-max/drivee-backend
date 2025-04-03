const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une offre (pour les écoles seulement)
exports.createOffre = async (req, res) => {
  try {
    const { title, description, price, durationHours, startDate, endDate, locationId } = req.body;
    
    const newOffre = await prisma.offre.create({
      data: {
        title,
        description,
        price,
        durationHours,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        schoolId: req.user.id, 
        locationId,
      },
    });
    res.status(201).json(newOffre);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création de l'offre" });
  }
};

// Lister toutes les offres (public)
exports.getAllOffres = async (req, res) => {
  try {
    const offres = await prisma.offre.findMany();
    res.json(offres);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Modifier une offre (pour l'école propriétaire ou l'admin)
exports.updateOffre = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier si l'offre appartient à l'école OU si l'utilisateur est un admin
    const offre = await prisma.offre.findUnique({ where: { id } });
    if (offre.schoolId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    const updatedOffre = await prisma.offre.update({
      where: { id },
      data: updates,
    });
    res.json(updatedOffre);
  } catch (error) {
    res.status(400).json({ error: "Erreur de modification" });
  }
};

// Supprimer une offre (pour l'école propriétaire ou l'admin)
exports.deleteOffre = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'offre appartient à l'école OU si l'utilisateur est un admin
    const offre = await prisma.offre.findUnique({ where: { id } });
    if (offre.schoolId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    await prisma.offre.delete({ where: { id } });
    res.json({ message: "Offre supprimée" });
  } catch (error) {
    res.status(400).json({ error: "Erreur de suppression" });
  }
};