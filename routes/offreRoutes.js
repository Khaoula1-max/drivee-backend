const express = require('express');
const router = express.Router();
const {
  createOffre,
  getAllOffres,
  getOffreById,
  updateOffre,
  deleteOffre,
} = require('../controllers/offreController');

// Définir les routes pour les opérations CRUD sur les offres
router.route('/')
  .get(getAllOffres) 
  .post(createOffre); 

router.route('/:id')
  .get(getOffreById) 
  .patch(updateOffre) 
  .delete(deleteOffre); 

module.exports = router;