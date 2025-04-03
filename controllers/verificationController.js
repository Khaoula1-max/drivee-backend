const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.submitVerification = async (req, res) => {
  try {
 const { schoolName, proof } = req.body;

 // Vérifier que l'utilisateur est une école
 if (req.user.role !== 'SCHOOL') {
     return res.status(403).json({ error: "Réservé aux écoles." });
 }

const verification = await prisma.verification.create({
      data: {
        userId: req.user.id,
        schoolName,
        proof, 
      },
    });
    res.status(201).json(verification);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la soumission." });
  }
};

  // Lister toutes les vérifications (pour l'admin)
exports.getAllVerifications = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Réservé à l'admin." });
    }

const verifications = await prisma.verification.findMany();
    res.json(verifications);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};