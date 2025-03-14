const express = require('express');
const { signUp, login } = require('../controllers/userControllers');
const authenticateJWT = require('../middlewares/authMiddleware');
const router = express.Router();

// Route pour l'inscription
router.post('/signup', signUp);

// Route pour la connexion
router.post('/login', login);

// Route protégée pour récupérer les informations de l'utilisateur
router.get('/me', authenticateJWT, (req, res) => {
    res.json(req.user); // Retourner les informations de l'utilisateur
});

module.exports = router;