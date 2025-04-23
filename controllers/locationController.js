const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CITIES = require('../utils/cityData');

const locationController = {
  createLocation: async (req, res) => {
    try {
      const { address, city } = req.body;
      if (!CITIES.some(c => c.value === city)) {
        return res.status(400).json({ error: 'Ville non valide' });
      }

      const location = await prisma.location.create({
        data: { address, city }
      });

      res.json(location);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getAllLocations: async (req, res) => {
    try {
      const locations = await prisma.location.findMany();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getCities: async (req, res) => {
    res.json(CITIES);
  }
};

module.exports = locationController;