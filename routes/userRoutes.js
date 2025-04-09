const express = require('express');
const {
    signUpSchool,
    signUpLearner,
    login,
    logout,
    updateUser ,
    deleteUser ,
    forgotPassword,
    resetPassword
} = require('../controllers/userControllers'); // Ensure this path is correct
const authenticateJWT = require('../middlewares/authMiddleware');

const router = express.Router();

// Route pour l'inscription
router.post('/signupSchool', signUpSchool);

router.post('/signupLearner', signUpLearner);



// Route pour la connexion
router.post('/login', login);

// Route pour l'oubli de mot de passe
router.post('/forgot-password', forgotPassword);

// Route pour réinitialiser le mot de passe
router.post('/reset-password', resetPassword);

// Route pour la déconnexion
router.post('/logout', authenticateJWT, logout); // Ajout de la route de déconnexion

// Route protégée pour récupérer les informations de l'utilisateur
router.get('/me', authenticateJWT, (req, res) => {
    res.json(req.user);
});

// Route pour mettre à jour un utilisateur (protégée)
router.put('/:id', authenticateJWT, updateUser );

// Route pour supprimer un utilisateur (protégée)
router.delete('/:id', authenticateJWT, deleteUser );

module.exports = router;