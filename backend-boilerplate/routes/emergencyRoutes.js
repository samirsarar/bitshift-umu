const express = require('express');
const router = express.Router();
const {
  syncEmergencyData,
  getAllRoutes,
  createRoute,
  getAllLocations,
  createLocation,
  updateRouteStatus,
} = require('../controllers/emergencyController');
const { optionalProtect } = require('../middleware/authMiddleware');

// Primary sync endpoint used by frontend IndexedDB
router.post('/sync', optionalProtect, syncEmergencyData);

// Routes
router.get('/routes', getAllRoutes);
router.post('/routes', optionalProtect, createRoute);
router.patch('/routes/:id/status', optionalProtect, updateRouteStatus);

// Locations (SOS, shelters, medical points, hazards)
router.get('/locations', getAllLocations);
router.post('/locations', optionalProtect, createLocation);

module.exports = router;