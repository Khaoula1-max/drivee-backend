const express = require('express');
const {
    signUpSchool,
    signUpLearner,
    login,
    logout,
    updateUser,
    deleteUser,
    forgotPassword,
    resetPassword,
    createAdmin
} = require('../controllers/userControllers');
const authenticateJWT = require('../middlewares/authMiddleware');

const {  isAdmin, isSchool } = require('../middlewares/roleMiddleware');

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.post('/signupSchool', signUpSchool);
router.post('/signupLearner', signUpLearner);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ==================== AUTHENTICATED ROUTES ====================
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, (req, res) => {
    res.json({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName
    });
});

// ==================== SCHOOL-SPECIFIC ROUTES ====================
router.put('/school/profile', authenticateJWT, isSchool, updateUser);

// ==================== ADMIN ROUTES ====================
router.post('/admin/create', authenticateJWT, isAdmin, createAdmin);
router.get('/admin/users', authenticateJWT, isAdmin, /* controller à implémenter */);
router.put('/admin/users/:id', authenticateJWT, isAdmin, updateUser);
router.delete('/admin/users/:id', authenticateJWT, isAdmin, deleteUser);

// ==================== HYBRID ROUTES ====================
// Permet à un user de modifier son propre profil OU à un admin de modifier n'importe quel profil
router.put('/:id', authenticateJWT, async (req, res, next) => {
    if (req.user.id === req.params.id || req.user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
}, updateUser);

module.exports = router;