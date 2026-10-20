export const DEPOTS = [
  {
    id: 1,
    name: 'Noida Sec-37',
    region: 'Noida',
    lat: 28.566,
    lng: 77.328,
    polygon: [[28.562, 77.320], [28.575, 77.320], [28.575, 77.339], [28.562, 77.339]],
  },
  {
    id: 2,
    name: 'Anand Vihar',
    region: 'Delhi',
    lat: 28.648,
    lng: 77.317,
    polygon: [[28.642, 77.308], [28.656, 77.308], [28.656, 77.327], [28.642, 77.327]],
  },
  {
    id: 3,
    name: 'Ghaziabad Hub',
    region: 'UP',
    lat: 28.669,
    lng: 77.454,
    polygon: [[28.661, 77.445], [28.679, 77.445], [28.679, 77.468], [28.661, 77.468]],
  },
];

export const VEHICLES = [
  { id: 1, registration: 'DL1AB1234', depot_id: 1, route_id: 1, driver_id: 1, status: 'on-time', lat: 28.5661, lng: 77.3317, speed: 32 },
  { id: 2, registration: 'DL1AB5678', depot_id: 1, route_id: 2, driver_id: 2, status: 'late', lat: 28.5715, lng: 77.3341, speed: 26 },
  { id: 3, registration: 'DL1CD9911', depot_id: 2, route_id: 3, driver_id: 3, status: 'idle', lat: 28.6492, lng: 77.3188, speed: 0 },
  { id: 4, registration: 'DL1EF2255', depot_id: 2, route_id: 4, driver_id: 4, status: 'on-time', lat: 28.6468, lng: 77.3127, speed: 41 },
  { id: 5, registration: 'DL1GH3344', depot_id: 3, route_id: 5, driver_id: 5, status: 'on-time', lat: 28.6734, lng: 77.4588, speed: 35 },
];

export const USERS = [
  { id: 1, username: 'admin1', password: 'password', role: 'admin', name: 'Priya Sharma', depot_id: 1 },
  { id: 2, username: 'manager1', password: 'password', role: 'depot_manager', name: 'Rohit Verma', depot_id: 1 },
  { id: 3, username: 'ops1', password: 'password', role: 'control_room', name: 'Sonia Mehta', depot_id: 1 },
  { id: 4, username: 'driver1', password: 'password', role: 'driver', name: 'Aman Singh', depot_id: 1 },
  { id: 5, username: 'exec1', password: 'password', role: 'executive', name: 'Gaurav Nair', depot_id: 1 },
];

export const ROUTES = [
  { id: 1, name: 'Noida City Loop', depot_id: 1, stops: [{ name: 'Noida Sec-37', eta: '06:15' }, { name: 'Sector 62', eta: '06:35' }, { name: 'Botanical Garden', eta: '06:55' }] },
  { id: 2, name: 'Anand Vihar Connector', depot_id: 1, stops: [{ name: 'Anand Vihar', eta: '07:10' }, { name: 'Karkardooma', eta: '07:25' }, { name: 'Preet Vihar', eta: '07:40' }] },
  { id: 3, name: 'Ghaziabad Transit', depot_id: 3, stops: [{ name: 'Ghaziabad Hub', eta: '06:45' }, { name: 'Raj Nagar', eta: '07:00' }, { name: 'Indirapuram', eta: '07:25' }] },
  { id: 4, name: 'Metro Feeder East', depot_id: 2, stops: [{ name: 'Anand Vihar', eta: '08:00' }, { name: 'Shahdara', eta: '08:15' }, { name: 'Patparganj', eta: '08:40' }] },
  { id: 5, name: 'Noida Airport Link', depot_id: 1, stops: [{ name: 'Noida Sec-37', eta: '08:30' }, { name: 'NSEZ', eta: '08:55' }, { name: 'Yamuna Expressway', eta: '09:20' }] },
];

export const DUTIES = [
  { id: 1, driver_id: 1, vehicle_id: 1, route_id: 1, day: 'today', status: 'published', start_time: '06:15' },
  { id: 2, driver_id: 2, vehicle_id: 2, route_id: 2, day: 'today', status: 'acknowledged', start_time: '07:10' },
  { id: 3, driver_id: 3, vehicle_id: 3, route_id: 3, day: 'tomorrow', status: 'draft', start_time: '06:45' },
];

export const INCIDENTS = [
  { id: 1, type: 'breakdown', severity: 'P1', status: 'open', description: 'Bus stalled near Sector 62 stop.', vehicle_id: 1, depot_id: 1 },
  { id: 2, type: 'complaint', severity: 'P2', status: 'in_progress', description: 'Passenger reported AC issue on route 2.', vehicle_id: 2, depot_id: 1 },
  { id: 3, type: 'accident', severity: 'P3', status: 'resolved', description: 'Minor door scrape during boarding.', vehicle_id: 4, depot_id: 2 },
];

export const NOTICES = [
  { id: 1, title: 'Driver briefing', body: "Please review today's depot briefing before trip start.", audience: 'all_drivers', read_by: ['driver1'] },
  { id: 2, title: 'Route diversion alert', body: 'Noida Sector 62 route is temporarily rerouted for maintenance.', audience: 'depot_1', read_by: [] },
  { id: 3, title: 'Safety reminder', body: 'All drivers must confirm the daily inspection checklist.', audience: 'all_drivers', read_by: ['driver1'] },
];

export const DASHBOARD = {
  total_vehicles: VEHICLES.length,
  active_routes: ROUTES.length,
  open_incidents: 2,
  notices: NOTICES.length,
};
