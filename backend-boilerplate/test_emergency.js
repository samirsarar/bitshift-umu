const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const EvacuationRoute = require('./models/EvacuationRoute');
const CriticalLocation = require('./models/CriticalLocation');
const User = require('./models/User');
const emergencyRoutes = require('./routes/emergencyRoutes');
const errorHandler = require('./middleware/errorMiddleware');

// Setup test app and server
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

// Socket event recorder
const socketEvents = [];
const originalEmit = io.emit.bind(io);
io.emit = function (eventName, ...args) {
  socketEvents.push({ event: eventName, data: args[0], timestamp: new Date() });
  return originalEmit(eventName, ...args);
};

app.use('/api/emergency', emergencyRoutes);
app.use(errorHandler);

let testPort = 5055;
let testUserToken;
let testUserId;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

function pass(testName) {
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${testName}`);
}

function fail(testName, err) {
  console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${testName}`);
  console.error(`    ${colors.red}Error:${colors.reset}`, err.message || err);
}

// HTTP request helper
async function request(path, options = {}) {
  const url = `http://localhost:${testPort}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runAllTests() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   STARTING EMERGENCY SYSTEM COMPREHENSIVE TESTS    ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      pass(name);
      passedTests++;
    } catch (err) {
      fail(name, err);
      failedTests++;
    }
  }

  try {
    // 1. Connect DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`${colors.yellow}📦 Connected to Database for testing${colors.reset}`);

    // Start server
    await new Promise((resolve) => server.listen(testPort, resolve));
    console.log(`${colors.yellow}🌐 Test Server listening on port ${testPort}${colors.reset}\n`);

    // Clean up previous test emergency data
    await EvacuationRoute.deleteMany({ clientUUID: { $regex: /^test-/ } });
    await CriticalLocation.deleteMany({ clientUUID: { $regex: /^test-/ } });
    await User.deleteMany({ email: 'emergency_tester@example.com' });

    // Create a mock user for auth testing
    const user = await User.create({
      name: 'Test Responder',
      email: 'emergency_tester@example.com',
      password: 'password123',
      role: 'user',
    });
    testUserId = user._id;
    testUserToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // ==========================================
    // SECTION 1: EvacuationRoute Model Validations
    // ==========================================
    console.log(`${colors.bold}--- [1] EvacuationRoute Model Unit Tests ---${colors.reset}`);

    await test('EvacuationRoute creates successfully with valid path and clientUUID', async () => {
      const route = new EvacuationRoute({
        clientUUID: 'test-route-model-1',
        title: 'Safe Path Alpha',
        description: 'Paved road clear of debris',
        status: 'clear',
        path: [
          [28.6139, 77.209],
          [28.6145, 77.2105],
        ],
      });
      const saved = await route.save();
      if (!saved._id || saved.status !== 'clear') throw new Error('Failed to save route');
    });

    await test('EvacuationRoute fails validation if path has fewer than 2 coordinates', async () => {
      const invalidRoute = new EvacuationRoute({
        clientUUID: 'test-route-model-invalid-path',
        title: 'Single Point Route',
        path: [[28.6139, 77.209]],
      });
      let caught = false;
      try {
        await invalidRoute.validate();
      } catch (err) {
        caught = true;
      }
      if (!caught) throw new Error('Expected path validation error with < 2 coordinates');
    });

    await test('EvacuationRoute fails validation if status is not enum clear/caution/blocked', async () => {
      const invalidStatusRoute = new EvacuationRoute({
        clientUUID: 'test-route-model-invalid-status',
        title: 'Invalid Status Route',
        status: 'destroyed',
        path: [
          [28.6139, 77.209],
          [28.6145, 77.2105],
        ],
      });
      let caught = false;
      try {
        await invalidStatusRoute.validate();
      } catch (err) {
        caught = true;
      }
      if (!caught) throw new Error('Expected status enum validation error');
    });

    // ==========================================
    // SECTION 2: CriticalLocation Model Validations
    // ==========================================
    console.log(`\n${colors.bold}--- [2] CriticalLocation Model Unit Tests ---${colors.reset}`);

    await test('CriticalLocation creates successfully with valid coordinates and category', async () => {
      const loc = new CriticalLocation({
        clientUUID: 'test-loc-model-1',
        title: 'Red Cross Medical Camp',
        category: 'medical',
        urgency: 'high',
        latitude: 28.6139,
        longitude: 77.209,
      });
      const saved = await loc.save();
      if (!saved._id || saved.category !== 'medical') throw new Error('Failed to save location');
    });

    await test('CriticalLocation fails validation if category is invalid', async () => {
      const invalidCategory = new CriticalLocation({
        clientUUID: 'test-loc-invalid-category',
        title: 'Random Place',
        category: 'party_hall',
        latitude: 28.6139,
        longitude: 77.209,
      });
      let caught = false;
      try {
        await invalidCategory.validate();
      } catch (err) {
        caught = true;
      }
      if (!caught) throw new Error('Expected category enum validation error');
    });

    await test('CriticalLocation fails validation if latitude/longitude is missing', async () => {
      const missingCoords = new CriticalLocation({
        clientUUID: 'test-loc-missing-coords',
        title: 'No Coords',
        category: 'sos',
      });
      let caught = false;
      try {
        await missingCoords.validate();
      } catch (err) {
        caught = true;
      }
      if (!caught) throw new Error('Expected required coordinate validation error');
    });

    // ==========================================
    // SECTION 3: Emergency Routes & Controllers API
    // ==========================================
    console.log(`\n${colors.bold}--- [3] Emergency Routes & Controllers API Tests ---${colors.reset}`);

    let createdRouteId;
    await test('POST /api/emergency/routes - creates route anonymously & emits route:created socket event', async () => {
      socketEvents.length = 0; // Clear events

      const res = await request('/api/emergency/routes', {
        method: 'POST',
        body: {
          clientUUID: 'test-route-api-anon',
          title: 'North Emergency Corridor',
          description: 'Wide avenue for relief vehicles',
          status: 'clear',
          path: [
            [28.7041, 77.1025],
            [28.705, 77.1035],
          ],
          reporterName: 'Civil Defense Volunteer',
        },
      });

      if (res.status !== 201 || !res.data.success) {
        throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.reporterName !== 'Civil Defense Volunteer') {
        throw new Error('Reporter name mismatch');
      }
      createdRouteId = res.data.data._id;

      const evt = socketEvents.find((e) => e.event === 'route:created');
      if (!evt || evt.data.clientUUID !== 'test-route-api-anon') {
        throw new Error('Socket route:created event not emitted properly');
      }
    });

    await test('POST /api/emergency/routes - creates route with Bearer Token & assigns req.user', async () => {
      const res = await request('/api/emergency/routes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUserToken}` },
        body: {
          clientUUID: 'test-route-api-auth',
          title: 'Sector 5 Evac Bridge',
          path: [
            [28.7041, 77.1025],
            [28.706, 77.105],
          ],
        },
      });

      if (res.status !== 201 || !res.data.success) {
        throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.reporterName !== 'Test Responder') {
        throw new Error(`Expected reporterName 'Test Responder', got '${res.data.data.reporterName}'`);
      }
      if (String(res.data.data.reportedBy) !== String(testUserId)) {
        throw new Error('reportedBy user ID mismatch');
      }
    });

    await test('GET /api/emergency/routes - returns all evacuation routes', async () => {
      const res = await request('/api/emergency/routes');
      if (res.status !== 200 || !res.data.success) {
        throw new Error(`Expected status 200, got ${res.status}`);
      }
      if (!Array.isArray(res.data.data) || res.data.data.length < 2) {
        throw new Error(`Expected at least 2 routes, got ${res.data.data.length}`);
      }
    });

    await test('PATCH /api/emergency/routes/:id/status - updates route status & emits route:updated', async () => {
      socketEvents.length = 0;

      const res = await request(`/api/emergency/routes/${createdRouteId}/status`, {
        method: 'PATCH',
        body: { status: 'blocked' },
      });

      if (res.status !== 200 || !res.data.success) {
        throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.status !== 'blocked') {
        throw new Error(`Expected status 'blocked', got '${res.data.data.status}'`);
      }

      const evt = socketEvents.find((e) => e.event === 'route:updated');
      if (!evt || evt.data.status !== 'blocked') {
        throw new Error('Socket route:updated event was not emitted properly');
      }
    });

    await test('PATCH /api/emergency/routes/:id/status - returns 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(`/api/emergency/routes/${fakeId}/status`, {
        method: 'PATCH',
        body: { status: 'caution' },
      });
      if (res.status !== 404 || res.data.success !== false) {
        throw new Error(`Expected 404, got ${res.status}`);
      }
    });

    await test('POST /api/emergency/locations - creates location & emits location:created event', async () => {
      socketEvents.length = 0;

      const res = await request('/api/emergency/locations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUserToken}` },
        body: {
          clientUUID: 'test-loc-api-1',
          title: 'Shelter Hub Community Center',
          category: 'shelter',
          urgency: 'high',
          latitude: 28.5355,
          longitude: 77.391,
          description: '50 beds, clean drinking water available',
        },
      });

      if (res.status !== 201 || !res.data.success) {
        throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.reporterName !== 'Test Responder') {
        throw new Error('Authenticated user name not populated');
      }

      const evt = socketEvents.find((e) => e.event === 'location:created');
      if (!evt || evt.data.clientUUID !== 'test-loc-api-1') {
        throw new Error('Socket location:created event not emitted');
      }
    });

    await test('GET /api/emergency/locations - queries and filters by category and status', async () => {
      // Create another location with hazard category
      await CriticalLocation.create({
        clientUUID: 'test-loc-hazard-1',
        title: 'Fallen Power Lines',
        category: 'hazard',
        urgency: 'critical',
        latitude: 28.536,
        longitude: 77.392,
        status: 'active',
      });

      // Filter category=hazard
      const res = await request('/api/emergency/locations?category=hazard');
      if (res.status !== 200 || !res.data.success) {
        throw new Error(`Expected status 200, got ${res.status}`);
      }
      const allHazard = res.data.data.every((l) => l.category === 'hazard');
      if (!allHazard || res.data.data.length === 0) {
        throw new Error('Filtering by category failed');
      }

      // Filter category=shelter
      const resShelter = await request('/api/emergency/locations?category=shelter');
      if (resShelter.data.data.some((l) => l.category !== 'shelter')) {
        throw new Error('Filtering by category shelter failed');
      }
    });

    // ==========================================
    // SECTION 4: Bidirectional Offline Sync (Mesh/IndexedDB sync)
    // ==========================================
    console.log(`\n${colors.bold}--- [4] Bidirectional Offline Sync API Tests ---${colors.reset}`);

    await test('POST /api/emergency/sync - upserts offline batches and broadcasts updates', async () => {
      socketEvents.length = 0;

      const offlineRoutes = [
        {
          clientUUID: 'test-sync-route-1',
          title: 'Offline Evac Pathway 1',
          status: 'caution',
          path: [
            [28.6, 77.1],
            [28.61, 77.11],
          ],
          reporterName: 'Mesh Node A',
        },
        {
          clientUUID: 'test-sync-route-2',
          title: 'Offline Evac Pathway 2',
          status: 'clear',
          path: [
            [28.62, 77.12],
            [28.63, 77.13],
          ],
          reporterName: 'Mesh Node B',
        },
      ];

      const offlineLocations = [
        {
          clientUUID: 'test-sync-loc-sos-1',
          title: 'SOS Trapped Civilians',
          category: 'sos',
          urgency: 'critical',
          latitude: 28.605,
          longitude: 77.105,
          reporterName: 'Local Peer',
        },
      ];

      const res = await request('/api/emergency/sync', {
        method: 'POST',
        body: {
          routes: offlineRoutes,
          locations: offlineLocations,
        },
      });

      if (res.status !== 200 || !res.data.success) {
        throw new Error(`Sync failed: ${JSON.stringify(res.data)}`);
      }
      if (!res.data.syncTimestamp) {
        throw new Error('Sync response missing syncTimestamp');
      }

      // Verify records saved in DB
      const r1 = await EvacuationRoute.findOne({ clientUUID: 'test-sync-route-1' });
      const loc1 = await CriticalLocation.findOne({ clientUUID: 'test-sync-loc-sos-1' });
      if (!r1 || !loc1) throw new Error('Synced items not found in MongoDB');

      const routeEvt = socketEvents.find((e) => e.event === 'routes:synced');
      const locEvt = socketEvents.find((e) => e.event === 'locations:synced');
      if (!routeEvt || routeEvt.data.length !== 2) {
        throw new Error('routes:synced event not received with correct payload length');
      }
      if (!locEvt || locEvt.data.length !== 1) {
        throw new Error('locations:synced event not received with correct payload length');
      }
    });

    await test('POST /api/emergency/sync - idempotency test (re-syncing updates without duplicating)', async () => {
      const countBefore = await EvacuationRoute.countDocuments({ clientUUID: 'test-sync-route-1' });
      if (countBefore !== 1) throw new Error(`Initial count expected 1, got ${countBefore}`);

      // Re-sync with updated title and status
      const res = await request('/api/emergency/sync', {
        method: 'POST',
        body: {
          routes: [
            {
              clientUUID: 'test-sync-route-1',
              title: 'Offline Evac Pathway 1 - UPDATED',
              status: 'blocked',
              path: [
                [28.6, 77.1],
                [28.61, 77.11],
              ],
            },
          ],
          locations: [],
        },
      });

      if (res.status !== 200 || !res.data.success) {
        throw new Error(`Sync update failed: ${JSON.stringify(res.data)}`);
      }

      const countAfter = await EvacuationRoute.countDocuments({ clientUUID: 'test-sync-route-1' });
      if (countAfter !== 1) {
        throw new Error(`Idempotency violated! Found ${countAfter} documents for unique clientUUID`);
      }

      const doc = await EvacuationRoute.findOne({ clientUUID: 'test-sync-route-1' });
      if (doc.title !== 'Offline Evac Pathway 1 - UPDATED' || doc.status !== 'blocked') {
        throw new Error('Document fields were not properly updated on upsert');
      }
    });

    await test('POST /api/emergency/sync - returns server updates newer than lastSyncTimestamp', async () => {
      const pastTime = new Date(Date.now() - 60000).toISOString();
      const res = await request('/api/emergency/sync', {
        method: 'POST',
        body: {
          routes: [],
          locations: [],
          lastSyncTimestamp: pastTime,
        },
      });

      if (res.status !== 200 || !res.data.success) {
        throw new Error(`Sync query failed: ${JSON.stringify(res.data)}`);
      }
      const { serverRoutes, serverLocations } = res.data.data;
      if (!Array.isArray(serverRoutes) || serverRoutes.length === 0) {
        throw new Error('Expected serverRoutes updated recently');
      }
      if (!Array.isArray(serverLocations) || serverLocations.length === 0) {
        throw new Error('Expected serverLocations updated recently');
      }
    });

  } catch (err) {
    console.error(`\n${colors.red}Critical Test Suite Error:${colors.reset}`, err);
    failedTests++;
  } finally {
    // Cleanup test data
    console.log(`\n${colors.yellow}🧹 Cleaning up test artifacts...${colors.reset}`);
    await EvacuationRoute.deleteMany({ clientUUID: { $regex: /^test-/ } });
    await CriticalLocation.deleteMany({ clientUUID: { $regex: /^test-/ } });
    await User.deleteMany({ email: 'emergency_tester@example.com' });

    server.close();
    await mongoose.connection.close();
  }

  // Summary
  console.log(`\n${colors.bold}====================================================${colors.reset}`);
  console.log(`${colors.bold}                 TEST SUMMARY                       ${colors.reset}`);
  console.log(`${colors.bold}====================================================${colors.reset}`);
  console.log(`  Total Tests : ${totalTests}`);
  console.log(`  ${colors.green}Passed      : ${passedTests}${colors.reset}`);
  console.log(`  ${colors.red}Failed      : ${failedTests}${colors.reset}`);

  if (failedTests === 0) {
    console.log(`\n${colors.bold}${colors.green}🎉 ALL EMERGENCY FEATURES PASSED VERIFICATION!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bold}${colors.red}❌ SOME TESTS FAILED.${colors.reset}\n`);
    process.exit(1);
  }
}

runAllTests();
