const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Ajouter une review à une offre
exports.addReview = async (req, res) => {
  try {
    const { offreId, comment, score } = req.body;
    const userId = req.user.id; 

    // Vérifie si l'offre existe
    const offre = await prisma.offre.findUnique({ where: { id: offreId } });
    if (!offre) return res.status(404).json({ error: "Offre non trouvée" });

    // Crée la review
    const newReview = await prisma.review.create({
      data: {
        review: comment,
        score: parseFloat(score),
        userId,
        offreId
      }
    });

    res.status(201).json(newReview);
  } catch (error) {
    res.status(400).json({ error: "Erreur création review" });
  }
};

// Afficher toutes les reviews d'une offre
exports.getOffreReviews = async (req, res) => {
  try {
    const { offreId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { offreId },
      include: { user: { select: { firstName: true, lastName: true } } } 
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};