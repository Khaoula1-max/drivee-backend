const express = require('express');
const router = express.Router();
const offreController = require('../controllers/offreController');
const authenticateJWT = require('../middlewares/authMiddleware');
const { isSchool ,isAdmin ,isLearner } = require('../middlewares/roleMiddleware');
router.post('/', authenticateJWT, isSchool, offreController.createOffre);
router.get('/', offreController.getAllOffres);
router.get('/:id', offreController.getOffreById);
router.get('/school/:schoolId', offreController.getOffresBySchool); 
router.put('/:id', authenticateJWT,isSchool, offreController.updateOffre);
router.delete('/:id', authenticateJWT, offreController.deleteOffre);

module.exports = router;