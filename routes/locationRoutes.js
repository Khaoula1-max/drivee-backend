const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

//  Créer une location
router.post('/', locationController.createLocation);

//Lister toutes les locations
router.get('/', locationController.getAllLocations);

module.exports = router;