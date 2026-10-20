import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import openApiSpec from './openapi.js';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');
const DB_PATH = process.env.DATABASE_PATH || join(DATA_DIR, 'ncrtc.db');
const JWT_SECRET = process.env.JWT_SECRET || 'ncrtc-demo-secret';

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);
const app = express();
const PORT = Number(process.env.PORT || 8100);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174/';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const ensureColumn = async (tableName, columnName, columnDefinition) => {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  if (!columns.some((column) => column.name === columnName)) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
};

const parseStops = (value) => {
  try {
    return value ? JSON.parse(value) : [];
  } catch (error) {
    return [];
  }
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ detail: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({ detail: 'Invalid token' });
    }

    req.user = decoded;
    next();
  });
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ detail: 'You do not have permission to perform this action' });
  }
  next();
};

const seedUsers = async () => {
  const seed = [
    ['admin1', 'password', 'Priya Sharma', 'admin', 1],
    ['manager1', 'password', 'Rohit Verma', 'depot_manager', 1],
    ['ops1', 'password', 'Sonia Mehta', 'control_room', 1],
    ['driver1', 'password', 'Aman Singh', 'driver', 1],
    ['driver2', 'password', 'Rahul Sharma', 'driver', 1],
    ['driver3', 'password', 'Nimisha Jain', 'driver', 2],
    ['driver4', 'password', 'Rakesh Khurana', 'driver', 2],
    ['driver5', 'password', 'Pooja Arora', 'driver', 3],
    ['exec1', 'password', 'Gaurav Nair', 'executive', 1],
  ];

  for (const [username, password, name, role, depotId] of seed) {
    const passwordHash = bcrypt.hashSync(password, 10);
    await run(
      'INSERT OR IGNORE INTO users (username, password_hash, name, role, depot_id) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, name, role, depotId]
    );
  }
};

const seedData = async () => {
  const depotsCount = await get('SELECT COUNT(*) AS count FROM depots');
  if (depotsCount?.count === 0) {
    const depots = [
      [1, 'Noida Sec-37', 'Noida', 28.566, 77.328],
      [2, 'Anand Vihar', 'Delhi', 28.648, 77.317],
      [3, 'Ghaziabad Hub', 'UP', 28.669, 77.454],
    ];

    for (const [id, name, region, lat, lng] of depots) {
      await run('INSERT INTO depots (id, name, region, lat, lng) VALUES (?, ?, ?, ?, ?)', [id, name, region, lat, lng]);
    }
  }

  const sampleRoutes = [
    [1, 'Noida City Loop', 1, JSON.stringify([{ name: 'Noida Sec-37', eta: '06:15' }, { name: 'Sector 62', eta: '06:35' }, { name: 'Botanical Garden', eta: '06:55' }])],
    [2, 'Anand Vihar Connector', 1, JSON.stringify([{ name: 'Anand Vihar', eta: '07:10' }, { name: 'Karkardooma', eta: '07:25' }, { name: 'Preet Vihar', eta: '07:40' }])],
    [3, 'Ghaziabad Transit', 3, JSON.stringify([{ name: 'Ghaziabad Hub', eta: '06:45' }, { name: 'Raj Nagar', eta: '07:00' }, { name: 'Indirapuram', eta: '07:25' }])],
    [4, 'Metro Feeder East', 2, JSON.stringify([{ name: 'Anand Vihar', eta: '08:00' }, { name: 'Shahdara', eta: '08:15' }, { name: 'Patparganj', eta: '08:40' }])],
    [5, 'Noida Airport Link', 1, JSON.stringify([{ name: 'Noida Sec-37', eta: '08:30' }, { name: 'NSEZ', eta: '08:55' }, { name: 'Yamuna Expressway', eta: '09:20' }])],
  ];

  for (const [id, name, depotId, stops] of sampleRoutes) {
    await run('INSERT OR IGNORE INTO routes (id, name, depot_id, stops) VALUES (?, ?, ?, ?)', [id, name, depotId, stops]);
  }

  const vehiclesCount = await get('SELECT COUNT(*) AS count FROM vehicles');
  if (vehiclesCount?.count === 0) {
    const driverIds = {};
    for (const username of ['driver1', 'driver2', 'driver3', 'driver4', 'driver5']) {
      const driver = await get('SELECT id FROM users WHERE username = ?', [username]);
      driverIds[username] = driver?.id;
    }

    const vehicles = [
      [1, 'DL1AB1234', 1, 1, driverIds.driver1, 'on-time', 28.5561, 77.3117, 32],
      [2, 'DL1AB5678', 1, 2, driverIds.driver2, 'late', 28.5915, 77.3591, 26],
      [3, 'DL1CD9911', 2, 3, driverIds.driver3, 'idle', 28.6502, 77.2875, 0],
      [4, 'DL1EF2255', 2, 4, driverIds.driver4, 'on-time', 28.678, 77.340, 41],
      [5, 'DL1GH3344', 3, 5, driverIds.driver5, 'on-time', 28.691, 77.434, 35],
    ];

    for (const [id, reg, depotId, routeId, driverId, status, lat, lng, speed] of vehicles) {
      await run(
        'INSERT INTO vehicles (id, registration, depot_id, route_id, driver_id, status, lat, lng, speed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, reg, depotId, routeId, driverId, status, lat, lng, speed]
      );
    }
  }

  const dutiesCount = await get('SELECT COUNT(*) AS count FROM duties');
  if (dutiesCount?.count === 0) {
    const driverIds = {};
    for (const username of ['driver1', 'driver2', 'driver3']) {
      const driver = await get('SELECT id FROM users WHERE username = ?', [username]);
      driverIds[username] = driver?.id;
    }

    const duties = [
      [1, driverIds.driver1, 1, 1, 'today', 'published', '06:15'],
      [2, driverIds.driver2, 2, 2, 'today', 'published', '07:10'],
      [3, driverIds.driver3, 3, 3, 'tomorrow', 'draft', '06:45'],
    ];

    for (const [id, driverId, vehicleId, routeId, day, status, startTime] of duties) {
      await run('INSERT INTO duties (id, driver_id, vehicle_id, route_id, day, status, start_time) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, driverId, vehicleId, routeId, day, status, startTime]);
    }
  }

  const seededVehicleDrivers = [
    ['DL1AB1234', 'driver1'],
    ['DL1AB5678', 'driver2'],
    ['DL1CD9911', 'driver3'],
    ['DL1EF2255', 'driver4'],
    ['DL1GH3344', 'driver5'],
  ];

  for (const [registration, username] of seededVehicleDrivers) {
    await run(`
      UPDATE vehicles
      SET driver_id = (SELECT id FROM users WHERE username = ?)
      WHERE registration = ?
        AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = vehicles.driver_id AND users.role = 'driver')
    `, [username, registration]);
  }

  await run(`
    UPDATE duties
    SET driver_id = (SELECT vehicles.driver_id FROM vehicles WHERE vehicles.id = duties.vehicle_id)
    WHERE id IN (1, 2, 3)
      AND vehicle_id IN (1, 2, 3)
      AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = duties.driver_id AND users.role = 'driver')
  `);

  const incidentsCount = await get('SELECT COUNT(*) AS count FROM incidents');
  if (incidentsCount?.count === 0) {
    const incidents = [
      [1, 'breakdown', 'P1', 'open', 'Bus stalled near Sector 62 stop.', 1, 1, 'ops1', '2026-10-18T08:12:00Z'],
      [2, 'complaint', 'P2', 'in_progress', 'Passenger reported AC issue on route 2.', 2, 1, 'manager1', '2026-10-18T09:25:00Z'],
      [3, 'accident', 'P3', 'resolved', 'Minor door scrape during boarding.', 4, 2, 'ops1', '2026-10-17T16:08:00Z'],
    ];

    for (const [id, type, severity, status, description, vehicleId, depotId, assignedTo, createdAt] of incidents) {
      await run(
        'INSERT INTO incidents (id, type, severity, status, description, vehicle_id, depot_id, assigned_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, type, severity, status, description, vehicleId, depotId, assignedTo, createdAt, createdAt]
      );
      await run('INSERT INTO incident_events (incident_id, status, note, created_at, actor) VALUES (?, ?, ?, ?, ?)', [id, status, 'Initial creation', createdAt, 'system']);
    }
  }

  const noticesCount = await get('SELECT COUNT(*) AS count FROM notices');
  if (noticesCount?.count === 0) {
    const notices = [
      [1, 'Driver briefing', 'Please review today\'s depot briefing before trip start.', 'all_drivers', '2026-10-18T06:00:00Z'],
      [2, 'Route diversion alert', 'Noida Sector 62 route is temporarily rerouted for maintenance.', 'depot_1', '2026-10-18T07:05:00Z'],
      [3, 'Safety reminder', 'All drivers must confirm the daily inspection checklist.', 'all_drivers', '2026-10-17T18:30:00Z'],
    ];

    for (const [id, title, body, audience, publishedAt] of notices) {
      await run('INSERT INTO notices (id, title, body, audience, published_at) VALUES (?, ?, ?, ?, ?)', [id, title, body, audience, publishedAt]);
    }
  }

  const tripsCount = await get('SELECT COUNT(*) AS count FROM trips');
  if (tripsCount?.count === 0) {
    const driver = await get('SELECT id FROM users WHERE username = ?', ['driver1']);
    const historyPath = [
      [28.5661, 77.3317],
      [28.568, 77.34],
      [28.572, 77.35],
      [28.579, 77.362],
      [28.588, 77.374],
      [28.598, 77.386],
      [28.608, 77.395],
    ];
    await run(
      'INSERT INTO trips (id, vehicle_id, route_id, driver_id, started_at, ended_at, path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 1, driver?.id, '2026-10-17T06:15:00Z', '2026-10-17T07:02:00Z', JSON.stringify(historyPath)]
    );
  }
};

const initDatabase = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      role TEXT,
      depot_id INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS depots (
      id INTEGER PRIMARY KEY,
      name TEXT,
      region TEXT,
      lat REAL,
      lng REAL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY,
      name TEXT,
      depot_id INTEGER,
      stops TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY,
      registration TEXT UNIQUE,
      depot_id INTEGER,
      route_id INTEGER,
      driver_id INTEGER,
      status TEXT,
      lat REAL,
      lng REAL,
      speed REAL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS duties (
      id INTEGER PRIMARY KEY,
      driver_id INTEGER,
      vehicle_id INTEGER,
      route_id INTEGER,
      day TEXT,
      status TEXT,
      start_time TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY,
      type TEXT,
      severity TEXT,
      status TEXT,
      description TEXT,
      vehicle_id INTEGER,
      depot_id INTEGER,
      lat REAL,
      lng REAL,
      assigned_to TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS incident_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER,
      status TEXT,
      note TEXT,
      created_at TEXT,
      actor TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY,
      title TEXT,
      body TEXT,
      audience TEXT,
      published_at TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notice_reads (
      notice_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at TEXT NOT NULL,
      UNIQUE (notice_id, user_id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      route_id INTEGER NOT NULL,
      driver_id INTEGER,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      path TEXT NOT NULL
    )
  `);

  await ensureColumn('incidents', 'lat', 'REAL');
  await ensureColumn('incidents', 'lng', 'REAL');

  await seedUsers();
  await seedData();
};

const buildUserPayload = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role,
  depot_id: user.depot_id,
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ncrtc-bms' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }));

app.get('/', (req, res) => {
  res.redirect(FRONTEND_URL);
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ detail: 'Username and password are required' });
  }

  const user = await get('SELECT * FROM users WHERE username = ?', [username]);

  if (!user) {
    return res.status(401).json({ detail: 'Invalid username' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);

  if (!isValid) {
    return res.status(401).json({ detail: 'Invalid password' });
  }

  const token = jwt.sign(buildUserPayload(user), JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: buildUserPayload(user) });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await get('SELECT id, username, name, role, depot_id FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

app.get('/api/dashboard', authMiddleware, async (req, res) => {
  const stats = await get(`
    SELECT
      (SELECT COUNT(*) FROM vehicles) AS total_vehicles,
      (SELECT COUNT(*) FROM routes) AS active_routes,
      (SELECT COUNT(*) FROM incidents WHERE status IN ('open', 'in_progress')) AS open_incidents,
      (SELECT COUNT(*) FROM notices) AS notices
  `);

  res.json(stats);
});

app.get('/api/depots', authMiddleware, async (req, res) => {
  const depots = await all('SELECT * FROM depots ORDER BY id');
  res.json(depots);
});

app.get('/api/vehicles', authMiddleware, async (req, res) => {
  const vehicles = await all('SELECT * FROM vehicles ORDER BY id');
  const phase = Date.now() / 5000;
  res.json(vehicles.map((vehicle) => {
    const offset = phase + vehicle.id;
    return {
      ...vehicle,
      lat: vehicle.lat + Math.sin(offset) * 0.0012,
      lng: vehicle.lng + Math.cos(offset) * 0.0012,
      speed: vehicle.status === 'idle' ? 0 : Math.max(12, Math.round((vehicle.speed || 28) + Math.sin(offset / 2) * 4)),
      updated_at: new Date().toISOString(),
    };
  }));
});

app.get('/api/routes', authMiddleware, async (req, res) => {
  const routes = await all('SELECT * FROM routes ORDER BY id');
  res.json(routes.map((route) => ({ ...route, stops: parseStops(route.stops) })));
});

app.post('/api/routes', authMiddleware, requireRoles('admin', 'depot_manager'), async (req, res) => {
  const { name, depot_id, stops = [] } = req.body || {};

  if (!name || !depot_id) {
    return res.status(400).json({ detail: 'Route name and depot_id are required' });
  }

  const inserted = await run(
    'INSERT INTO routes (name, depot_id, stops) VALUES (?, ?, ?)',
    [name, depot_id, JSON.stringify(stops)]
  );

  const route = await get('SELECT * FROM routes WHERE id = ?', [inserted.id]);
  res.status(201).json({ ...route, stops: parseStops(route.stops) });
});

app.put('/api/routes/:id', authMiddleware, requireRoles('admin', 'depot_manager'), async (req, res) => {
  const { name, depot_id, stops = [] } = req.body || {};

  await run('UPDATE routes SET name = ?, depot_id = ?, stops = ? WHERE id = ?', [name, depot_id, JSON.stringify(stops), req.params.id]);

  const route = await get('SELECT * FROM routes WHERE id = ?', [req.params.id]);
  res.json({ ...route, stops: parseStops(route.stops) });
});

app.delete('/api/routes/:id', authMiddleware, requireRoles('admin', 'depot_manager'), async (req, res) => {
  await run('DELETE FROM routes WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

app.get('/api/duties', authMiddleware, async (req, res) => {
  const duties = req.user.role === 'driver'
    ? await all('SELECT * FROM duties WHERE driver_id = ? ORDER BY id', [req.user.id])
    : await all('SELECT * FROM duties ORDER BY id');
  res.json(duties);
});

const validateDutyInput = async ({ driver_id, vehicle_id, route_id, start_time }) => {
  if (!driver_id || !vehicle_id || !route_id || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start_time || '')) {
    return 'Driver, vehicle, route, and a valid start time are required';
  }

  const [driver, vehicle, route] = await Promise.all([
    get('SELECT id FROM users WHERE id = ? AND role = ?', [driver_id, 'driver']),
    get('SELECT id FROM vehicles WHERE id = ?', [vehicle_id]),
    get('SELECT id FROM routes WHERE id = ?', [route_id]),
  ]);

  if (!driver || !vehicle || !route) {
    return 'Select an existing driver, vehicle, and route';
  }

  return null;
};

app.post('/api/duties', authMiddleware, requireRoles('admin', 'depot_manager'), async (req, res) => {
  const { driver_id, vehicle_id, route_id, start_time } = req.body || {};
  const validationError = await validateDutyInput({ driver_id, vehicle_id, route_id, start_time });
  if (validationError) {
    return res.status(400).json({ detail: validationError });
  }

  const existing = await get('SELECT id FROM duties WHERE driver_id = ? AND day = ?', [driver_id, 'tomorrow']);
  if (existing) {
    return res.status(409).json({ detail: 'This driver already has a duty for tomorrow. Edit the existing draft instead.' });
  }

  const inserted = await run(
    'INSERT INTO duties (driver_id, vehicle_id, route_id, day, status, start_time) VALUES (?, ?, ?, ?, ?, ?)',
    [driver_id, vehicle_id, route_id, 'tomorrow', 'draft', start_time]
  );
  const duty = await get('SELECT * FROM duties WHERE id = ?', [inserted.id]);
  res.status(201).json(duty);
});

app.put('/api/duties/:id', authMiddleware, requireRoles('admin', 'depot_manager'), async (req, res) => {
  const duty = await get('SELECT * FROM duties WHERE id = ?', [req.params.id]);
  if (!duty) {
    return res.status(404).json({ detail: 'Duty not found' });
  }
  if (duty.day !== 'tomorrow' || duty.status !== 'draft') {
    return res.status(409).json({ detail: 'Only tomorrow draft duties can be edited' });
  }

  const { driver_id, vehicle_id, route_id, start_time } = req.body || {};
  const validationError = await validateDutyInput({ driver_id, vehicle_id, route_id, start_time });
  if (validationError) {
    return res.status(400).json({ detail: validationError });
  }

  const existing = await get('SELECT id FROM duties WHERE driver_id = ? AND day = ? AND id != ?', [driver_id, 'tomorrow', duty.id]);
  if (existing) {
    return res.status(409).json({ detail: 'This driver already has another duty for tomorrow' });
  }

  await run(
    'UPDATE duties SET driver_id = ?, vehicle_id = ?, route_id = ?, start_time = ? WHERE id = ?',
    [driver_id, vehicle_id, route_id, start_time, duty.id]
  );
  const updated = await get('SELECT * FROM duties WHERE id = ?', [duty.id]);
  res.json(updated);
});

app.patch('/api/duties/:id/reopen', authMiddleware, requireRoles('admin', 'depot_manager'), async (req, res) => {
  const duty = await get('SELECT * FROM duties WHERE id = ?', [req.params.id]);
  if (!duty) {
    return res.status(404).json({ detail: 'Duty not found' });
  }
  if (duty.day !== 'tomorrow') {
    return res.status(400).json({ detail: 'Only tomorrow duties can be reopened for editing' });
  }

  await run('UPDATE duties SET status = ? WHERE id = ?', ['draft', duty.id]);
  res.json({ ...duty, status: 'draft' });
});

app.patch('/api/duties/:id/publish', authMiddleware, requireRoles('admin', 'depot_manager'), async (req, res) => {
  const duty = await get('SELECT * FROM duties WHERE id = ?', [req.params.id]);
  if (!duty) {
    return res.status(404).json({ detail: 'Duty not found' });
  }
  if (duty.day !== 'tomorrow') {
    return res.status(400).json({ detail: 'Only tomorrow duties can be published from this roster' });
  }

  await run('UPDATE duties SET status = ? WHERE id = ?', ['published', duty.id]);
  res.json({ ...duty, status: 'published' });
});

app.patch('/api/duties/:id/acknowledge', authMiddleware, requireRoles('driver'), async (req, res) => {
  const duty = await get('SELECT * FROM duties WHERE id = ? AND driver_id = ?', [req.params.id, req.user.id]);
  if (!duty) {
    return res.status(404).json({ detail: 'Duty not found for this driver' });
  }
  if (duty.status === 'draft') {
    return res.status(409).json({ detail: 'This duty has not been published yet' });
  }

  await run('UPDATE duties SET status = ? WHERE id = ?', ['acknowledged', duty.id]);
  res.json({ ...duty, status: 'acknowledged' });
});

app.get('/api/incidents', authMiddleware, async (req, res) => {
  const incidents = await all('SELECT * FROM incidents ORDER BY updated_at DESC');
  res.json(incidents);
});

app.get('/api/trips', authMiddleware, async (req, res) => {
  const trips = await all(`
    SELECT trips.id, trips.vehicle_id, vehicles.registration, trips.route_id, routes.name AS route_name,
      trips.driver_id, users.name AS driver_name, trips.started_at, trips.ended_at
    FROM trips
    LEFT JOIN vehicles ON vehicles.id = trips.vehicle_id
    LEFT JOIN routes ON routes.id = trips.route_id
    LEFT JOIN users ON users.id = trips.driver_id
    ORDER BY trips.started_at DESC
  `);
  res.json(trips);
});

app.get('/api/trips/:id', authMiddleware, async (req, res) => {
  const trip = await get('SELECT * FROM trips WHERE id = ?', [req.params.id]);
  if (!trip) {
    return res.status(404).json({ detail: 'Trip not found' });
  }
  res.json({ ...trip, path: parseStops(trip.path) });
});

app.get('/api/incidents/:id', authMiddleware, async (req, res) => {
  const incident = await get('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
  if (!incident) {
    return res.status(404).json({ detail: 'Incident not found' });
  }
  const events = await all('SELECT * FROM incident_events WHERE incident_id = ? ORDER BY created_at ASC', [req.params.id]);
  res.json({ incident, events });
});

app.post('/api/incidents', authMiddleware, async (req, res) => {
  const { type, severity, description, vehicle_id, depot_id, lat, lng, assigned_to = req.user.username, status = 'open' } = req.body || {};
  if (!type || !description) {
    return res.status(400).json({ detail: 'Incident type and description are required' });
  }
  if (!['P1', 'P2', 'P3'].includes(severity)) {
    return res.status(400).json({ detail: 'Severity must be P1, P2, or P3' });
  }
  const timestamp = new Date().toISOString();
  const vehicle = vehicle_id ? await get('SELECT lat, lng FROM vehicles WHERE id = ?', [vehicle_id]) : null;
  const incidentLat = lat ?? vehicle?.lat ?? null;
  const incidentLng = lng ?? vehicle?.lng ?? null;

  const incident = await run(
    'INSERT INTO incidents (type, severity, status, description, vehicle_id, depot_id, lat, lng, assigned_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [type, severity, status, description, vehicle_id || null, depot_id || null, incidentLat, incidentLng, assigned_to, timestamp, timestamp]
  );

  await run('INSERT INTO incident_events (incident_id, status, note, created_at, actor) VALUES (?, ?, ?, ?, ?)', [incident.id, status, 'Emergency incident raised', timestamp, req.user.username]);

  const saved = await get('SELECT * FROM incidents WHERE id = ?', [incident.id]);
  res.status(201).json(saved);
});

app.patch('/api/incidents/:id/status', authMiddleware, requireRoles('admin', 'depot_manager', 'control_room'), async (req, res) => {
  const { status, note = 'Status updated', assigned_to } = req.body || {};
  const validStatuses = ['open', 'acknowledged', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ detail: 'Invalid incident status' });
  }

  const existing = await get('SELECT id FROM incidents WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ detail: 'Incident not found' });
  }

  const timestamp = new Date().toISOString();

  await run(
    'UPDATE incidents SET status = ?, updated_at = ?, assigned_to = COALESCE(?, assigned_to) WHERE id = ?',
    [status, timestamp, assigned_to || null, req.params.id]
  );

  await run('INSERT INTO incident_events (incident_id, status, note, created_at, actor) VALUES (?, ?, ?, ?, ?)', [req.params.id, status, note, timestamp, req.user.username]);

  const incident = await get('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
  res.json(incident);
});

app.get('/api/notices', authMiddleware, async (req, res) => {
  const notices = await all(`
    SELECT notices.*, COUNT(notice_reads.user_id) AS read_count
    FROM notices
    LEFT JOIN notice_reads ON notice_reads.notice_id = notices.id
    GROUP BY notices.id
    ORDER BY notices.published_at DESC
  `);

  for (const notice of notices) {
    const readers = await all(
      'SELECT users.username FROM notice_reads JOIN users ON users.id = notice_reads.user_id WHERE notice_reads.notice_id = ?',
      [notice.id]
    );
    notice.read_by = readers.map((reader) => reader.username);
  }

  res.json(notices);
});

app.post('/api/notices', authMiddleware, requireRoles('admin', 'depot_manager', 'control_room'), async (req, res) => {
  const { title, body, audience = 'all_drivers' } = req.body || {};
  const timestamp = new Date().toISOString();

  const notice = await run('INSERT INTO notices (title, body, audience, published_at) VALUES (?, ?, ?, ?)', [title, body, audience, timestamp]);
  const saved = await get('SELECT * FROM notices WHERE id = ?', [notice.id]);
  res.status(201).json(saved);
});

app.post('/api/notices/:id/read', authMiddleware, async (req, res) => {
  const notice = await get('SELECT id FROM notices WHERE id = ?', [req.params.id]);
  if (!notice) {
    return res.status(404).json({ detail: 'Notice not found' });
  }

  if (req.user.role === 'driver') {
    await run(
      'INSERT OR IGNORE INTO notice_reads (notice_id, user_id, read_at) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, new Date().toISOString()]
    );
  }

  const readers = await all(
    'SELECT users.username FROM notice_reads JOIN users ON users.id = notice_reads.user_id WHERE notice_reads.notice_id = ?',
    [req.params.id]
  );
  res.json({ success: true, read_by: readers.map((reader) => reader.username) });
});

app.get('/api/users', authMiddleware, async (req, res) => {
  const users = await all('SELECT id, username, name, role, depot_id FROM users ORDER BY id');
  res.json(users);
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ detail: 'Server error', message: error.message });
});

await initDatabase();

app.listen(PORT, () => {
  console.log(`NCRTC BMS backend running on http://localhost:${PORT}`);
});
