const EvacuationRoute = require('../models/EvacuationRoute');
const CriticalLocation = require('../models/CriticalLocation');

// @route   POST /api/emergency/sync
// @desc    Bidirectional synchronization of offline-stored routes and locations
exports.syncEmergencyData = async (req, res, next) => {
  try {
    const { routes = [], locations = [], lastSyncTimestamp } = req.body;
    const io = req.app.get('io');

    const newRoutes = [];
    const newLocations = [];

    // 1. Ingest offline-created evacuation routes (upsert by clientUUID)
    for (const route of routes) {
      if (!route.clientUUID || !route.path) continue;

      const updated = await EvacuationRoute.findOneAndUpdate(
        { clientUUID: route.clientUUID },
        {
          ...route,
          reportedBy: req.user ? req.user._id : null,
          reporterName: req.user ? req.user.name : route.reporterName || 'Offline Peer',
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      newRoutes.push(updated);
    }

    // 2. Ingest offline-created critical locations/hazards/SOS
    for (const loc of locations) {
      if (!loc.clientUUID || loc.latitude === undefined || loc.longitude === undefined) continue;

      const updated = await CriticalLocation.findOneAndUpdate(
        { clientUUID: loc.clientUUID },
        {
          ...loc,
          reportedBy: req.user ? req.user._id : null,
          reporterName: req.user ? req.user.name : loc.reporterName || 'Offline Peer',
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      newLocations.push(updated);
    }

    // 3. Broadcast newly synced emergency data to all clients on local network
    if (io) {
      if (newRoutes.length > 0) io.emit('routes:synced', newRoutes);
      if (newLocations.length > 0) io.emit('locations:synced', newLocations);
    }

    // 4. Query updates that occurred since the client's last sync
    const syncQuery = lastSyncTimestamp ? { updatedAt: { $gt: new Date(lastSyncTimestamp) } } : {};

    const serverRoutes = await EvacuationRoute.find(syncQuery).sort({ updatedAt: -1 });
    const serverLocations = await CriticalLocation.find(syncQuery).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Sync completed successfully',
      syncTimestamp: new Date().toISOString(),
      data: {
        serverRoutes,
        serverLocations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/emergency/routes
exports.getAllRoutes = async (req, res, next) => {
  try {
    const routes = await EvacuationRoute.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/emergency/routes
exports.createRoute = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const routeData = {
      ...req.body,
      reportedBy: req.user ? req.user._id : null,
      reporterName: req.user ? req.user.name : req.body.reporterName || 'Responder',
    };

    const route = await EvacuationRoute.create(routeData);

    if (io) io.emit('route:created', route);

    res.status(201).json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/emergency/locations
exports.getAllLocations = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const locations = await CriticalLocation.find(filter).sort({ urgency: -1, updatedAt: -1 });
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/emergency/locations
exports.createLocation = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const locationData = {
      ...req.body,
      reportedBy: req.user ? req.user._id : null,
      reporterName: req.user ? req.user.name : req.body.reporterName || 'Citizen',
    };

    const location = await CriticalLocation.create(locationData);

    if (io) io.emit('location:created', location);

    res.status(201).json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/emergency/routes/:id/status
exports.updateRouteStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const io = req.app.get('io');

    const route = await EvacuationRoute.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true }
    );

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    if (io) io.emit('route:updated', route);

    res.status(200).json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};