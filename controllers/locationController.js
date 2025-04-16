const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une location
exports.createLocation = async (req, res) => {
  try {
    const { address, city } = req.body;
    
    // Vérifie que la ville est valide (Prisma le fait automatiquement, mais on peut pré-valider)
    const validCities = ['HAY_ADRAR', 'AIT_MELLOUL', 'BENSERGAW', 'BATTOIRE', 'TALBORJT', 'DCHEIRA', 'INZEGANE'];
    if (!validCities.includes(city)) {
      return res.status(400).json({ error: "Ville non autorisée" });
    }

    const location = await prisma.location.create({
      data: { address, city },
    });
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ error: "Erreur de création" });
  }
};

// Récupérer toutes les locations
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await prisma.location.findMany();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: "Erreur de récupération" });
  }
};