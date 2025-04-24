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
    createAdmin,
    getAllUsers
} = require('../controllers/userControllers');
const authenticateJWT = require('../middlewares/authMiddleware');
const { isLearner, isSchool, isAdmin } = require('../middlewares/roleMiddleware');

const router = express.Router();


router.post('/signupSchool', signUpSchool);
router.post('/signupLearner', signUpLearner);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/users', getAllUsers);

router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, (req, res) => {
    res.json(req.user); 
});
router.put('/learner/profile', authenticateJWT, isLearner, updateUser);
router.put('/school/profile', authenticateJWT, isSchool, updateUser);
router.post('/admin/create', authenticateJWT, isAdmin, createAdmin);
router.put('/admin/users/:id', authenticateJWT, isAdmin, updateUser);
router.delete('/admin/users/:id', authenticateJWT, isAdmin, deleteUser);
router.put('/:id', authenticateJWT, async (req, res, next) => {
    if (req.user.id === req.params.id || req.user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
}, updateUser);

module.exports = router;