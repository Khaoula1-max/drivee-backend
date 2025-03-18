const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une nouvelle vérification
const createVerification = async (req, res) => {
  const { userId, schoolName, proof } = req.body;

  try {
    const verification = await prisma.verification.create({
      data: {
        userId,
        schoolName,
        proof,
      },
    });
    res.status(201).json(verification);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la vérification' });
  }
};

// Obtenir toutes les vérifications
const getAllVerifications = async (req, res) => {
  try {
    const verifications = await prisma.verification.findMany();
    res.status(200).json(verifications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des vérifications' });
  }
};

// Obtenir une vérification par ID
const getVerificationById = async (req, res) => {
  const { id } = req.params;

  try {
    const verification = await prisma.verification.findUnique({
      where: { id },
    });
    if (!verification) {
      return res.status(404).json({ error: 'Vérification non trouvée' });
    }
    res.status(200).json(verification);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la vérification' });
  }
};

// Mettre à jour une vérification
const updateVerification = async (req, res) => {
  const { id } = req.params;
  const { schoolName, proof } = req.body;

  try {
    const verification = await prisma.verification.update({
      where: { id },
      data: {
        schoolName,
        proof,
      },
    });
    res.status(200).json(verification);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la vérification' });
  }
};

// Supprimer une vérification
const deleteVerification = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.verification.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la vérification' });
  }
};

module.exports = {
  createVerification,
  getAllVerifications,
  getVerificationById,
  updateVerification,
  deleteVerification,
};