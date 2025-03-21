// controllers/verificationController.js

// Simuler une base de données en mémoire
let verifications = [];
let currentId = 1; // Simuler un ID auto-incrémenté

// Créer une nouvelle vérification
exports.createVerification = async (req, res) => {
  const { schoolName, proof } = req.body;
  const userId = req.user.id; // Récupérer l'ID de l'utilisateur à partir de la requête

  try {
    const newVerification = {
      id: currentId++, 
      userId,
      schoolName,
      proof,
      approved: null, 
    };
    verifications.push(newVerification); // Ajouter à la "base de données"
    res.status(201).json(newVerification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de la vérification' });
  }
};

// Obtenir toutes les vérifications
exports.getAllVerifications = async (req, res) => {
  try {
    res.status(200).json(verifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vérifications' });
  }
};

// Approuver une vérification
exports.approveVerification = async (req, res) => {
  const { id } = req.params;

  try {
    const verification = verifications.find(v => v.id === parseInt(id));
    if (!verification) {
      return res.status(404).json({ error: 'Vérification non trouvée' });
    }
    verification.approved = true; // Marquer comme approuvé
    res.status(200).json(verification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation de la vérification' });
  }
};

// Rejeter une vérification
exports.rejectVerification = async (req, res) => {
  const { id } = req.params;

  try {
    const verification = verifications.find(v => v.id === parseInt(id));
    if (!verification) {
      return res.status(404).json({ error: 'Vérification non trouvée' });
    }
    verification.approved = false; // Marquer comme rejeté
    res.status(200).json(verification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du rejet de la vérification' });
  }
};