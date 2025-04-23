const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.post('/', locationController.createLocation);
router.get('/', locationController.getAllLocations);
router.get('/cities', locationController.getCities);

module.exports = router;