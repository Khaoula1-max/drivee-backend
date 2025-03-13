const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Route pour créer une nouvelle école
app.post('/schools', async (req, res) => {
  const { name, phoneNumber, address, password, description, verification } = req.body;
  try {
    const newSchool = await prisma.school.create({
      data: {
        name,
        phoneNumber,
        address,
        password,
        description,
        verification,
      },
    });
    res.status(201).json(newSchool);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de l\'école' });
  }
});

// Route pour obtenir toutes les écoles
app.get('/schools', async (req, res) => {
  try {
    const schools = await prisma.school.findMany();
    res.status(200).json(schools);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des écoles' });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});