import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const FALLBACK_DATA = {
  dashboard: { total_vehicles: 5, active_routes: 5, open_incidents: 2, notices: 3 },
  depots: [
    { id: 1, name: 'Noida Sec-37', lat: 28.566, lng: 77.328 },
    { id: 2, name: 'Anand Vihar', lat: 28.648, lng: 77.317 },
    { id: 3, name: 'Ghaziabad Hub', lat: 28.669, lng: 77.454 },
  ],
  vehicles: [
    { id: 1, registration: 'DL1AB1234', depot_id: 1, route_id: 1, driver_id: 1, status: 'on-time', lat: 28.5661, lng: 77.3317, speed: 32 },
    { id: 2, registration: 'DL1AB5678', depot_id: 1, route_id: 2, driver_id: 2, status: 'late', lat: 28.5715, lng: 77.3341, speed: 26 },
    { id: 3, registration: 'DL1CD9911', depot_id: 2, route_id: 3, driver_id: 3, status: 'idle', lat: 28.6492, lng: 77.3188, speed: 0 },
    { id: 4, registration: 'DL1EF2255', depot_id: 2, route_id: 4, driver_id: 4, status: 'on-time', lat: 28.6468, lng: 77.3127, speed: 41 },
    { id: 5, registration: 'DL1GH3344', depot_id: 3, route_id: 5, driver_id: 5, status: 'on-time', lat: 28.6734, lng: 77.4588, speed: 35 },
  ],
  routes: [
    { id: 1, name: 'Noida City Loop', depot_id: 1, stops: [{ name: 'Noida Sec-37', eta: '06:15' }, { name: 'Sector 62', eta: '06:35' }, { name: 'Botanical Garden', eta: '06:55' }] },
    { id: 2, name: 'Anand Vihar Connector', depot_id: 1, stops: [{ name: 'Anand Vihar', eta: '07:10' }, { name: 'Karkardooma', eta: '07:25' }, { name: 'Preet Vihar', eta: '07:40' }] },
    { id: 3, name: 'Ghaziabad Transit', depot_id: 3, stops: [{ name: 'Ghaziabad Hub', eta: '06:45' }, { name: 'Raj Nagar', eta: '07:00' }, { name: 'Indirapuram', eta: '07:25' }] },
    { id: 4, name: 'Metro Feeder East', depot_id: 2, stops: [{ name: 'Anand Vihar', eta: '08:00' }, { name: 'Shahdara', eta: '08:15' }, { name: 'Patparganj', eta: '08:40' }] },
    { id: 5, name: 'Noida Airport Link', depot_id: 1, stops: [{ name: 'Noida Sec-37', eta: '08:30' }, { name: 'NSEZ', eta: '08:55' }, { name: 'Yamuna Expressway', eta: '09:20' }] },
  ],
  drivers: [
    { id: 1, name: 'Aman Singh', role: 'driver' },
    { id: 2, name: 'Rahul Sharma', role: 'driver' },
    { id: 3, name: 'Nimisha Jain', role: 'driver' },
    { id: 4, name: 'Rakesh Khurana', role: 'driver' },
    { id: 5, name: 'Pooja Arora', role: 'driver' },
  ],
  duties: [
    { id: 1, driver_id: 1, vehicle_id: 1, route_id: 1, day: 'today', status: 'published', start_time: '06:15' },
    { id: 2, driver_id: 2, vehicle_id: 2, route_id: 2, day: 'today', status: 'acknowledged', start_time: '07:10' },
    { id: 3, driver_id: 3, vehicle_id: 3, route_id: 3, day: 'tomorrow', status: 'draft', start_time: '06:45' },
  ],
  incidents: [
    { id: 1, type: 'breakdown', severity: 'P1', status: 'open', description: 'Bus stalled near Sector 62 stop.', vehicle_id: 1, depot_id: 1 },
    { id: 2, type: 'complaint', severity: 'P2', status: 'in_progress', description: 'Passenger reported AC issue on route 2.', vehicle_id: 2, depot_id: 1 },
    { id: 3, type: 'accident', severity: 'P3', status: 'resolved', description: 'Minor door scrape during boarding.', vehicle_id: 4, depot_id: 2 },
  ],
  notices: [
    { id: 1, title: 'Driver briefing', body: 'Please review today\'s depot briefing before trip start.', audience: 'all_drivers', read_by: ['driver1'] },
    { id: 2, title: 'Route diversion alert', body: 'Noida Sector 62 route is temporarily rerouted for maintenance.', audience: 'depot_1', read_by: [] },
    { id: 3, title: 'Safety reminder', body: 'All drivers must confirm the daily inspection checklist.', audience: 'all_drivers', read_by: ['driver1'] },
  ],
  trips: [
    { id: 1, vehicle_id: 1, registration: 'DL1AB1234', route_id: 1, route_name: 'Noida City Loop', driver_id: 4, driver_name: 'Aman Singh', started_at: '2026-10-17T06:15:00Z', ended_at: '2026-10-17T07:02:00Z' },
  ],
  users: [
    { id: 1, username: 'admin1', role: 'admin', name: 'Priya Sharma', depot_id: 1 },
    { id: 2, username: 'manager1', role: 'depot_manager', name: 'Rohit Verma', depot_id: 1 },
    { id: 3, username: 'ops1', role: 'control_room', name: 'Sonia Mehta', depot_id: 1 },
    { id: 4, username: 'driver1', role: 'driver', name: 'Aman Singh', depot_id: 1 },
    { id: 5, username: 'exec1', role: 'executive', name: 'Gaurav Nair', depot_id: 1 },
  ],
};

const HISTORY_PATHS = {
  1: [[28.5661, 77.3317], [28.5672, 77.3330], [28.5681, 77.3345]],
  2: [[28.5715, 77.3341], [28.5725, 77.3358], [28.5745, 77.3388]],
  3: [[28.6492, 77.3188], [28.6502, 77.3199], [28.6524, 77.3215]],
  4: [[28.6468, 77.3127], [28.6476, 77.3140], [28.6498, 77.3162]],
  5: [[28.6734, 77.4588], [28.6752, 77.4602], [28.6768, 77.4620]],
};

function FitMapToPath({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions?.length) {
      map.fitBounds(positions, { padding: [28, 28] });
    }
  }, [map, positions]);

  return null;
}

const roleLabel = {
  admin: 'Admin',
  depot_manager: 'Depot Manager',
  control_room: 'Control Room',
  driver: 'Driver',
  executive: 'Executive',
};

const statusColors = {
  'on-time': '#1bbf7a',
  late: '#f5b21d',
  idle: '#8894a0',
  open: '#db4a62',
  in_progress: '#f5a623',
  resolved: '#39a56f',
  published: '#1ca6e5',
  draft: '#8c95a7',
  acknowledged: '#29a672',
  P1: '#d72638',
  P2: '#f5a623',
  P3: '#6c7ae0',
};

const formatRouteStops = (stops) => {
  if (!Array.isArray(stops)) return 'No stops configured';
  return stops.map((stop) => stop.name || stop).join(' → ');
};

async function apiFetch(endpoint, options = {}, token = localStorage.getItem('ncrtcToken')) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, { ...options, headers });
  const rawText = await response.text();
  const parsed = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
    throw new Error(parsed?.detail || parsed?.message || 'Request failed');
  }

  return parsed;
}

function getVehicleById(id, vehicles) {
  return vehicles.find((vehicle) => vehicle.id === id) || null;
}

function getRouteById(id, routes) {
  return routes.find((route) => route.id === id) || null;
}

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(FALLBACK_DATA);
  const [selectedDepot, setSelectedDepot] = useState('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState(1);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: 'driver1', password: 'password' });
  const [routeForm, setRouteForm] = useState({ name: 'Airport Link', depot_id: 1, stops: 'Sec 37, Sector 62, Airport' });
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [incidentWorkflow, setIncidentWorkflow] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [historyTrip, setHistoryTrip] = useState(null);
  const [lastMapUpdate, setLastMapUpdate] = useState(null);
  const [openedNoticeId, setOpenedNoticeId] = useState(null);
  const [driverMessage, setDriverMessage] = useState('');
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [dutyDrafts, setDutyDrafts] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async (jwtToken = localStorage.getItem('ncrtcToken')) => {
    try {
      setIsLoading(true);
      const [dashboard, depots, vehicles, routes, duties, incidents, notices, users, trips] = await Promise.all([
        apiFetch('/dashboard', {}, jwtToken).catch(() => null),
        apiFetch('/depots', {}, jwtToken).catch(() => null),
        apiFetch('/vehicles', {}, jwtToken).catch(() => null),
        apiFetch('/routes', {}, jwtToken).catch(() => null),
        apiFetch('/duties', {}, jwtToken).catch(() => null),
        apiFetch('/incidents', {}, jwtToken).catch(() => null),
        apiFetch('/notices', {}, jwtToken).catch(() => null),
        apiFetch('/users', {}, jwtToken).catch(() => null),
        apiFetch('/trips', {}, jwtToken).catch(() => null),
      ]);

      const nextData = { ...FALLBACK_DATA };
      if (dashboard) nextData.dashboard = dashboard;
      if (depots) nextData.depots = depots;
      if (vehicles) nextData.vehicles = vehicles;
      if (routes) nextData.routes = routes;
      if (duties) nextData.duties = duties;
      if (incidents) nextData.incidents = incidents;
      if (notices) nextData.notices = notices;
      if (users) nextData.users = users;
      if (trips) {
        nextData.trips = trips;
        setSelectedTripId((currentId) => currentId || String(trips[0]?.id || ''));
      }
      setData(nextData);
    } catch (error) {
      console.error('Load data failed:', error);
      setData(FALLBACK_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('ncrtcToken');
    if (!token) {
      setData(FALLBACK_DATA);
      return;
    }

    apiFetch('/auth/me', {}, token)
      .then((loggedInUser) => {
        setUser(loggedInUser);
        setActiveTab(loggedInUser.role === 'driver' ? 'driver' : 'dashboard');
        loadData(token);
      })
      .catch(() => {
        localStorage.removeItem('ncrtcToken');
        setUser(null);
      });
  }, []);

  useEffect(() => {
    if (!user || activeTab !== 'avls') return undefined;

    let cancelled = false;
    const refreshFleet = async () => {
      try {
        const [vehicles, incidents] = await Promise.all([
          apiFetch('/vehicles'),
          apiFetch('/incidents'),
        ]);
        if (!cancelled) {
          setData((current) => ({ ...current, vehicles, incidents }));
          setLastMapUpdate(new Date());
        }
      } catch (error) {
        console.error('Live fleet refresh failed:', error);
      }
    };

    refreshFleet();
    const timer = window.setInterval(refreshFleet, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (!selectedTripId || !user) {
      setHistoryTrip(null);
      return undefined;
    }

    let cancelled = false;
    apiFetch(`/trips/${selectedTripId}`)
      .then((trip) => {
        if (!cancelled) setHistoryTrip(trip);
      })
      .catch(() => {
        if (!cancelled) setHistoryTrip(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTripId, user?.id]);

  const selectedVehicle = useMemo(
    () => getVehicleById(selectedVehicleId, data.vehicles),
    [selectedVehicleId, data.vehicles]
  );

  const visibleVehicles = useMemo(() => {
    if (selectedDepot === 'all') return data.vehicles;
    return data.vehicles.filter((vehicle) => vehicle.depot_id === Number(selectedDepot));
  }, [selectedDepot, data.vehicles]);

  const selectedIncident = useMemo(
    () => data.incidents.find((incident) => incident.id === selectedIncidentId) || data.incidents[0],
    [selectedIncidentId, data.incidents]
  );

  useEffect(() => {
    if (!user || !selectedIncident) {
      setIncidentWorkflow(null);
      return undefined;
    }

    let cancelled = false;
    apiFetch(`/incidents/${selectedIncident.id}`)
      .then((workflow) => {
        if (!cancelled) setIncidentWorkflow(workflow);
      })
      .catch(() => {
        if (!cancelled) setIncidentWorkflow(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedIncident?.id, user?.id]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const result = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      }, null);

      localStorage.setItem('ncrtcToken', result.token);
      setUser(result.user);
      setActiveTab(result.user.role === 'driver' ? 'driver' : 'dashboard');
      setDriverMessage('');
      await loadData(result.token);
    } catch (error) {
      alert(error.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ncrtcToken');
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleRouteSave = async () => {
    try {
      const stops = routeForm.stops.split(',').map((stop, index) => {
        const minutesAfterSeven = index * 20;
        const hours = 7 + Math.floor(minutesAfterSeven / 60);
        const minutes = minutesAfterSeven % 60;
        return {
          name: stop.trim(),
          eta: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        };
      }).filter((stop) => stop.name);

      await apiFetch(editingRouteId ? `/routes/${editingRouteId}` : '/routes', {
        method: editingRouteId ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: routeForm.name,
          depot_id: Number(routeForm.depot_id),
          stops,
        }),
      }, localStorage.getItem('ncrtcToken'));

      setRouteForm({ name: '', depot_id: data.depots[0]?.id || 1, stops: '' });
      setEditingRouteId(null);
      await loadData(localStorage.getItem('ncrtcToken'));
    } catch (error) {
      alert(error.message || 'Failed to save route');
    }
  };

  const handleRouteEdit = (route) => {
    setEditingRouteId(route.id);
    setRouteForm({
      name: route.name,
      depot_id: route.depot_id,
      stops: (route.stops || []).map((stop) => stop.name || stop).join(', '),
    });
  };

  const handleRouteDelete = async (routeId) => {
    if (!window.confirm('Delete this route?')) return;

    try {
      await apiFetch(`/routes/${routeId}`, { method: 'DELETE' });
      await loadData(localStorage.getItem('ncrtcToken'));
    } catch (error) {
      alert(error.message || 'Failed to delete route');
    }
  };

  const handlePublishDuty = async (dutyId) => {
    try {
      await apiFetch(`/duties/${dutyId}/publish`, { method: 'PATCH' });
      await loadData();
    } catch (error) {
      alert(error.message || 'Could not publish the duty');
    }
  };

  const handleReopenDuty = async (dutyId) => {
    try {
      await apiFetch(`/duties/${dutyId}/reopen`, { method: 'PATCH' });
      await loadData();
    } catch (error) {
      alert(error.message || 'Could not reopen the duty for editing');
    }
  };

  const getTomorrowDutyDraft = (driver, duty) => {
    const saved = dutyDrafts[driver.id];
    if (saved) return saved;

    const assignedVehicle = data.vehicles.find((vehicle) => vehicle.driver_id === driver.id);
    return {
      driver_id: driver.id,
      vehicle_id: duty?.vehicle_id || assignedVehicle?.id || '',
      route_id: duty?.route_id || assignedVehicle?.route_id || '',
      start_time: duty?.start_time || '07:00',
    };
  };

  const handleDutyDraftChange = (driver, duty, field, value) => {
    setDutyDrafts((current) => ({
      ...current,
      [driver.id]: {
        ...getTomorrowDutyDraft(driver, duty),
        [field]: field === 'start_time' ? value : Number(value),
      },
    }));
  };

  const handleSaveTomorrowDuty = async (driver, duty) => {
    const payload = getTomorrowDutyDraft(driver, duty);
    const endpoint = duty ? `/duties/${duty.id}` : '/duties';

    try {
      await apiFetch(endpoint, {
        method: duty ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setDutyDrafts((current) => {
        const next = { ...current };
        delete next[driver.id];
        return next;
      });
      setDriverMessage(`${driver.name}’s duty saved as a draft for tomorrow.`);
      await loadData();
    } catch (error) {
      alert(error.message || 'Could not save tomorrow’s duty');
    }
  };

  const handlePublishTomorrow = async () => {
    const drafts = data.duties.filter((duty) => duty.day === 'tomorrow' && duty.status === 'draft');
    if (!drafts.length) {
      setDriverMessage('There are no draft duties for tomorrow.');
      return;
    }

    try {
      await Promise.all(drafts.map((duty) => apiFetch(`/duties/${duty.id}/publish`, { method: 'PATCH' })));
      await loadData();
    } catch (error) {
      alert(error.message || 'Could not publish tomorrow’s duties');
    }
  };

  const handleAcknowledgeDuty = async (dutyId) => {
    try {
      await apiFetch(`/duties/${dutyId}/acknowledge`, { method: 'PATCH' });
      setDriverMessage('Duty acknowledged successfully.');
      await loadData();
    } catch (error) {
      alert(error.message || 'Could not acknowledge this duty');
    }
  };

  const handleOpenNotice = async (notice) => {
    setOpenedNoticeId((currentId) => currentId === notice.id ? null : notice.id);
    if (user?.role !== 'driver') return;

    try {
      await apiFetch(`/notices/${notice.id}/read`, { method: 'POST' });
      await loadData();
    } catch (error) {
      console.error('Could not save notice read receipt:', error);
    }
  };

  const handlePanicButton = async (duty, vehicle) => {
    const depotId = vehicle?.depot_id || user?.depot_id || null;
    try {
      const incident = await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          type: 'panic',
          severity: 'P1',
          description: `Panic alert: ${user?.name || 'Driver'} requests immediate assistance${vehicle ? ` from ${vehicle.registration}` : ''}.`,
          vehicle_id: vehicle?.id || duty?.vehicle_id || null,
          depot_id: depotId,
          assigned_to: 'ops1',
        }),
      });
      setDriverMessage(`P1 emergency sent to control room (incident #${incident.id}).`);
      await loadData();
    } catch (error) {
      alert(error.message || 'Could not send the emergency alert');
    }
  };

  const handleIncidentAssign = async (incident) => {
    const assignedTo = assignmentDrafts[incident.id] || incident.assigned_to || 'ops1';
    try {
      await apiFetch(`/incidents/${incident.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: incident.status,
          assigned_to: assignedTo,
          note: `Assigned to ${assignedTo}`,
        }),
      });
      await loadData();
    } catch (error) {
      alert(error.message || 'Could not assign incident');
    }
  };

  const handleIncidentStatus = async (incidentId, status) => {
    try {
      await apiFetch(`/incidents/${incidentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note: `Updated via dashboard to ${status}` }),
      }, localStorage.getItem('ncrtcToken'));
      await loadData(localStorage.getItem('ncrtcToken'));
    } catch (error) {
      alert(error.message || 'Failed to update incident');
    }
  };

  const currentRole = user?.role || 'driver';
  const canManageScheduling = ['admin', 'depot_manager'].includes(currentRole);
  const isControlRoom = ['admin', 'control_room'].includes(currentRole);

  const renderDashboard = () => (
    <div className="panel-grid">
      <div className="summary-card accent-blue">
        <span>Total Vehicles</span>
        <strong>{data.dashboard.total_vehicles}</strong>
      </div>
      <div className="summary-card accent-green">
        <span>Active Routes</span>
        <strong>{data.dashboard.active_routes}</strong>
      </div>
      <div className="summary-card accent-red">
        <span>Open Incidents</span>
        <strong>{data.dashboard.open_incidents}</strong>
      </div>
      <div className="summary-card accent-gold">
        <span>Notices</span>
        <strong>{data.dashboard.notices}</strong>
      </div>

      <div className="card wide">
        <h3>Live fleet snapshot</h3>
        {isLoading ? <p>Loading fleet data…</p> : (
          <div className="mini-table">
            <div className="mini-row header-row">
              <span>Vehicle</span>
              <span>Route</span>
              <span>Status</span>
              <span>Speed</span>
            </div>
            {data.vehicles.map((vehicle) => (
              <div className="mini-row" key={vehicle.id}>
                <span>{vehicle.registration}</span>
                <span>{getRouteById(vehicle.route_id, data.routes)?.name || '—'}</span>
                <span className="status-pill" style={{ background: statusColors[vehicle.status] || '#6b7280' }}>
                  {vehicle.status}
                </span>
                <span>{vehicle.speed ?? 0} km/h</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAVLS = () => (
    <div className="module-shell">
      <div className="toolbar">
        <label>
          Depot filter
          <select value={selectedDepot} onChange={(event) => setSelectedDepot(event.target.value)}>
            <option value="all">All depots</option>
            {data.depots.map((depot) => (
              <option value={depot.id} key={depot.id}>{depot.name}</option>
            ))}
          </select>
        </label>
        <span className="live-indicator"><span /> Live positions · refresh every 4 sec</span>
        {lastMapUpdate && <small className="last-updated">Updated {lastMapUpdate.toLocaleTimeString()}</small>}
      </div>

      <div className="map-layout">
        <div className="map-panel">
          <MapContainer key="live-fleet-map" center={[28.65, 77.33]} zoom={11} scrollWheelZoom style={{ height: '430px', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {visibleVehicles.map((vehicle) => (
              <Marker
                key={vehicle.id}
                position={[vehicle.lat, vehicle.lng]}
                icon={new L.DivIcon({
                  className: 'custom-pin',
                  html: `<div style="background:${statusColors[vehicle.status] || '#6b7280'};" class="map-marker">${vehicle.id}</div>`,
                  iconSize: [22, 22],
                })}
                eventHandlers={{ click: () => setSelectedVehicleId(vehicle.id) }}
              >
                <Popup>{vehicle.registration} — {vehicle.status}</Popup>
              </Marker>
            ))}
            {data.incidents.filter((incident) => incident.lat != null && incident.lng != null && ['open', 'acknowledged', 'in_progress'].includes(incident.status)).map((incident) => (
              <Marker
                key={`incident-${incident.id}`}
                position={[incident.lat, incident.lng]}
                icon={new L.DivIcon({
                  className: 'custom-pin incident-pin',
                  html: `<div class="map-marker incident-map-marker">!</div>`,
                  iconSize: [26, 26],
                })}
                eventHandlers={{
                  click: () => {
                    setSelectedIncidentId(incident.id);
                    window.setTimeout(() => document.getElementById(`incident-${incident.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                  },
                }}
              >
                <Popup>{incident.severity} · {incident.type}: {incident.description}</Popup>
              </Marker>
            ))}
            {selectedVehicle && (
              <Polyline positions={HISTORY_PATHS[selectedVehicle.id] || []} color="#3d8bfd" weight={3} />
            )}
            {activeTab === 'avls' && historyTrip?.path?.length > 0 && (
              <Polyline positions={historyTrip.path} color="#7c3aed" weight={4} dashArray="8 8" />
            )}
          </MapContainer>
        </div>

        <aside className="side-panel">
          <h3>Vehicle detail</h3>
          {selectedVehicle ? (
            <>
              <p><strong>Reg no:</strong> {selectedVehicle.registration}</p>
              <p><strong>Driver:</strong> {data.users.find((d) => d.id === selectedVehicle.driver_id)?.name || 'Unassigned'}</p>
              <p><strong>Route:</strong> {getRouteById(selectedVehicle.route_id, data.routes)?.name || '—'}</p>
              <p><strong>Status:</strong> {selectedVehicle.status}</p>
              <div className="history-block">
                <h4>Recent pings</h4>
                <ul>
                  {(HISTORY_PATHS[selectedVehicle.id] || []).map((point, index) => (
                    <li key={`${selectedVehicle.id}-${index}`}>{point[0].toFixed(4)}, {point[1].toFixed(4)}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p>No vehicle selected.</p>
          )}
        </aside>
      </div>

      {isControlRoom && (
        <div className="card wide">
          <h3>Active incident queue</h3>
          <div className="incident-list">
            {data.incidents.filter((incident) => ['open', 'acknowledged', 'in_progress'].includes(incident.status)).map((incident) => (
              <div className={`incident-item ${selectedIncidentId === incident.id ? 'incident-selected' : ''}`} id={`incident-${incident.id}`} key={incident.id}>
                <div className="incident-meta">
                  <span className="status-pill" style={{ background: statusColors[incident.severity] || '#6b7280' }}>{incident.severity}</span>
                  <span className="status-pill" style={{ background: statusColors[incident.status] || '#6b7280' }}>{incident.status}</span>
                  <strong>#{incident.id} · {incident.type}</strong>
                </div>
                <p>{incident.description}</p>
                {incident.lat != null && incident.lng != null && <small>Location · {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}</small>}
                <div className="incident-actions">
                  <select
                    aria-label={`Assign incident ${incident.id}`}
                    value={assignmentDrafts[incident.id] ?? incident.assigned_to ?? 'ops1'}
                    onChange={(event) => setAssignmentDrafts({ ...assignmentDrafts, [incident.id]: event.target.value })}
                  >
                    {data.users.filter((staff) => ['admin', 'depot_manager', 'control_room'].includes(staff.role)).map((staff) => (
                      <option value={staff.username} key={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                  <button className="primary-button" onClick={() => handleIncidentAssign(incident)}>Assign incident</button>
                </div>
              </div>
            ))}
            {!data.incidents.some((incident) => ['open', 'acknowledged', 'in_progress'].includes(incident.status)) && <p>No active incidents.</p>}
          </div>
        </div>
      )}

      {isControlRoom && historyTrip && (
        <div className="card wide history-preview">
          <div>
            <p className="eyebrow">Previous trip</p>
            <strong>{historyTrip.route_id ? getRouteById(historyTrip.route_id, data.routes)?.name : 'Trip history'}</strong>
            <small>{new Date(historyTrip.started_at).toLocaleDateString()} · {historyTrip.path?.length || 0} location points</small>
          </div>
          <button className="secondary-button" onClick={() => setActiveTab('history')}>Open full history replay</button>
        </div>
      )}
    </div>
  );

  const renderScheduling = () => {
    const renderDuty = (driver, day) => {
      const duty = data.duties.find((entry) => entry.driver_id === driver.id && entry.day === day);
      const vehicle = duty && getVehicleById(duty.vehicle_id, data.vehicles);
      const route = duty && getRouteById(duty.route_id, data.routes);

      if (day === 'tomorrow' && canManageScheduling) {
        if (duty && duty.status !== 'draft') {
          return (
            <div className="duty-cell-content">
              <strong>{route?.name || 'Route pending'}</strong>
              <span>{vehicle?.registration || 'Vehicle pending'} · {duty.start_time}</span>
              <span className={`duty-status status-${duty.status}`}>{duty.status}</span>
              <button className="small-action" onClick={() => handleReopenDuty(duty.id)}>Reopen to edit</button>
            </div>
          );
        }

        const draft = getTomorrowDutyDraft(driver, duty);
        return (
          <div className="duty-editor">
            <label>
              Vehicle
              <select value={draft.vehicle_id} onChange={(event) => handleDutyDraftChange(driver, duty, 'vehicle_id', event.target.value)}>
                <option value="">Select vehicle</option>
                {data.vehicles.map((entry) => <option value={entry.id} key={entry.id}>{entry.registration}</option>)}
              </select>
            </label>
            <label>
              Route
              <select value={draft.route_id} onChange={(event) => handleDutyDraftChange(driver, duty, 'route_id', event.target.value)}>
                <option value="">Select route</option>
                {data.routes.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
              </select>
            </label>
            <label>
              Start time
              <input type="time" value={draft.start_time} onChange={(event) => handleDutyDraftChange(driver, duty, 'start_time', event.target.value)} />
            </label>
            <div className="duty-editor-actions">
              <button className="small-action" onClick={() => handleSaveTomorrowDuty(driver, duty)}>
                {duty ? 'Save draft' : 'Create draft'}
              </button>
              {duty && <button className="secondary-button" onClick={() => handlePublishDuty(duty.id)}>Publish</button>}
            </div>
          </div>
        );
      }

      if (!duty) return <span className="muted">Unassigned</span>;

      return (
        <div className="duty-cell-content">
          <strong>{route?.name || 'Route pending'}</strong>
          <span>{vehicle?.registration || 'Vehicle pending'} · {duty.start_time}</span>
          <span className={`duty-status status-${duty.status}`}>{duty.status}</span>
        </div>
      );
    };

    return (
      <div className="module-shell">
        {canManageScheduling && currentRole === 'admin' && (
          <div className="card wide">
            <h3>{editingRouteId ? 'Edit route' : 'Add new route'}</h3>
            <div className="route-form">
              <input placeholder="Route name" value={routeForm.name} onChange={(event) => setRouteForm({ ...routeForm, name: event.target.value })} />
              <select value={routeForm.depot_id} onChange={(event) => setRouteForm({ ...routeForm, depot_id: event.target.value })}>
                {data.depots.map((depot) => <option value={depot.id} key={depot.id}>{depot.name}</option>)}
              </select>
              <input placeholder="Stops: e.g. Sec 37, Sector 62, Airport" value={routeForm.stops} onChange={(event) => setRouteForm({ ...routeForm, stops: event.target.value })} />
              <button className="primary-button" onClick={handleRouteSave}>{editingRouteId ? 'Save changes' : 'Create route'}</button>
              {editingRouteId && <button className="secondary-button" onClick={() => { setEditingRouteId(null); setRouteForm({ name: '', depot_id: data.depots[0]?.id || 1, stops: '' }); }}>Cancel</button>}
            </div>
          </div>
        )}

        {canManageScheduling && currentRole === 'admin' && (
          <div className="card wide">
            <h3>Routes</h3>
            <div className="route-list">
              {data.routes.map((route) => (
                <div className="notice-item" key={route.id}>
                  <div className="notice-footer">
                    <h4>{route.name}</h4>
                    <div className="incident-actions">
                      <button className="secondary-button" onClick={() => handleRouteEdit(route)}>Edit</button>
                      <button className="secondary-button" onClick={() => handleRouteDelete(route.id)}>Delete</button>
                    </div>
                  </div>
                  <p>{formatRouteStops(route.stops)}</p>
                  <small>{data.depots.find((depot) => depot.id === route.depot_id)?.name || 'Depot not assigned'}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Duty management</p>
              <h3>Roster · Today &amp; tomorrow</h3>
            </div>
            {canManageScheduling && <button className="primary-button" onClick={handlePublishTomorrow}>Publish tomorrow’s duties</button>}
          </div>
          {driverMessage && <p className="inline-success">{driverMessage}</p>}
          <div className="roster-grid">
            <div className="roster-header">Driver</div>
            <div className="roster-header">Today</div>
            <div className="roster-header">Tomorrow</div>
            {data.users.filter((entry) => entry.role === 'driver').map((driver) => (
              <Fragment key={driver.id}>
                <div className="roster-cell driver-name">{driver.name}<small>{driver.username}</small></div>
                <div className="roster-cell">{renderDuty(driver, 'today')}</div>
                <div className="roster-cell">{renderDuty(driver, 'tomorrow')}</div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderIMS = () => (
    <div className="module-shell">
      <div className="card wide">
        <h3>Incident management</h3>
        <div className="incident-list">
          {data.incidents.map((incident) => (
            <div className="incident-item" key={incident.id}>
              <div className="incident-meta">
                <span className="status-pill" style={{ background: statusColors[incident.status] || '#6b7280' }}>{incident.status}</span>
                <span className="status-pill" style={{ background: statusColors[incident.severity] || '#6b7280' }}>{incident.severity}</span>
              </div>
              <h4>{incident.type}</h4>
              <p>{incident.description}</p>
              <small>Vehicle {incident.vehicle_id} · Depot {incident.depot_id}</small>
              <div className="incident-actions">
                <select value={incident.status} onChange={(event) => handleIncidentStatus(incident.id, event.target.value)}>
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button className="secondary-button" onClick={() => setSelectedIncidentId(incident.id)}>Detail</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedIncident && (
        <div className="card wide detail-card">
          <h3>Incident detail</h3>
          <p><strong>Type:</strong> {selectedIncident.type}</p>
          <p><strong>Severity:</strong> {selectedIncident.severity}</p>
          <p><strong>Status:</strong> {selectedIncident.status}</p>
          <p><strong>Description:</strong> {selectedIncident.description}</p>
          <div className="timeline-box">
            <strong>Workflow notes</strong>
            <ul>
              {(incidentWorkflow?.events || []).map((event) => (
                <li key={event.id}>
                  {new Date(event.created_at).toLocaleString()} · {event.status} — {event.note} ({event.actor})
                </li>
              ))}
              {!incidentWorkflow?.events?.length && <li>No workflow events recorded yet.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderCMS = () => (
    <div className="card wide">
      <h3>Notice center</h3>
      {data.notices.map((notice) => (
        <div className="notice-item" key={notice.id}>
          <h4>{notice.title}</h4>
          <p>{notice.body}</p>
          <div className="notice-footer">
            <span>{notice.audience}</span>
            <span>{notice.read_by ? notice.read_by.length : 0} reads</span>
          </div>
          <button className="secondary-button notice-open-button" onClick={() => handleOpenNotice(notice)}>
            {openedNoticeId === notice.id ? 'Close notice' : 'Open notice'}
          </button>
          {openedNoticeId === notice.id && <p className="notice-open-copy">{notice.body}</p>}
        </div>
      ))}
    </div>
  );

  const renderDriverPortal = () => {
    const driverDuty = data.duties.find((duty) => duty.driver_id === user?.id && duty.day === 'today');
    const routeForDuty = getRouteById(driverDuty?.route_id, data.routes);
    const vehicleForDuty = getVehicleById(driverDuty?.vehicle_id, data.vehicles);
    const driverDepot = data.depots.find((depot) => depot.id === user?.depot_id);
    const latestNotice = [...data.notices].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))[0];

    return (
      <div className="driver-view">
        <div className="card">
          <p className="eyebrow">Driver portal</p>
          <h3>Today’s duty</h3>
          {driverDuty ? (
            <>
              <p><strong>Depot:</strong> {driverDepot?.name || 'Depot'}</p>
              <p><strong>Vehicle:</strong> {vehicleForDuty?.registration || 'Vehicle pending'}</p>
              <p><strong>Route:</strong> {routeForDuty?.name || 'Route pending'}</p>
              <p><strong>Start time:</strong> {driverDuty.start_time}</p>
              <span className={`duty-status status-${driverDuty.status}`}>{driverDuty.status}</span>
              {driverDuty.status !== 'acknowledged' && (
                <button className="primary-button" onClick={() => handleAcknowledgeDuty(driverDuty.id)}>Acknowledge duty</button>
              )}
            </>
          ) : <p>No duty is assigned to you for today.</p>}
          {driverMessage && <p className="inline-success" role="status">{driverMessage}</p>}
        </div>
        <div className="card">
          <p className="eyebrow">Need immediate assistance?</p>
          <h3>Emergency</h3>
          <button className="panic-button" onClick={() => handlePanicButton(driverDuty, vehicleForDuty)}>Panic Button · Send P1 alert</button>
          <p className="muted">The control room will receive your location, vehicle, and depot details.</p>
        </div>
        {latestNotice && (
          <div className="card driver-notice-card">
            <p className="eyebrow">Latest notice · {new Date(latestNotice.published_at || Date.now()).toLocaleString()}</p>
            <h3>{latestNotice.title}</h3>
            {openedNoticeId === latestNotice.id && <p>{latestNotice.body}</p>}
            <button className="secondary-button" onClick={() => handleOpenNotice(latestNotice)}>
              {openedNoticeId === latestNotice.id ? 'Close notice' : 'Open latest notice'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => (
    <div className="module-shell">
      <div className="card wide history-toolbar">
        <div>
          <p className="eyebrow">AVLS replay</p>
          <h3>Past trip history</h3>
        </div>
        <label>
          Select trip
          <select value={selectedTripId} onChange={(event) => setSelectedTripId(event.target.value)}>
            {data.trips.map((trip) => (
              <option value={trip.id} key={trip.id}>
                {trip.registration} · {trip.route_name} · {new Date(trip.started_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>
      </div>
      {historyTrip ? (
        <>
          <div className="history-summary card wide">
            <strong>{historyTrip.route_id ? getRouteById(historyTrip.route_id, data.routes)?.name : 'Historical trip'}</strong>
            <span>
              {historyTrip.registration || getVehicleById(historyTrip.vehicle_id, data.vehicles)?.registration} · {historyTrip.driver_name || data.users.find((entry) => entry.id === historyTrip.driver_id)?.name || 'Driver'}
            </span>
            <span>{new Date(historyTrip.started_at).toLocaleString()} – {new Date(historyTrip.ended_at).toLocaleTimeString()}</span>
          </div>
          <div className="map-panel history-map">
            <MapContainer key={`history-${historyTrip.id}`} center={historyTrip.path?.[0] || [28.58, 77.36]} zoom={12} scrollWheelZoom style={{ height: '520px', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <FitMapToPath positions={historyTrip.path || []} />
              {historyTrip.path?.length > 0 && <Polyline positions={historyTrip.path} color="#7c3aed" weight={5} />}
            </MapContainer>
          </div>
          <div className="card wide">
            <h4>Trip path</h4>
            <p>{historyTrip.path?.length || 0} recorded location points · purple line shows the previous trip.</p>
          </div>
        </>
      ) : <div className="card wide"><p>No historical trips are available yet.</p></div>}
    </div>
  );

  const pages = {
    dashboard: renderDashboard,
    avls: renderAVLS,
    scheduling: renderScheduling,
    history: renderHistory,
    ims: renderIMS,
    cms: renderCMS,
    driver: renderDriverPortal,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-mark">N</div>
          <div>
            <h1>NCRTC</h1>
            <small>Bus Management System</small>
          </div>
        </div>

        <nav className="nav">
          <button className={activeTab === 'dashboard' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={activeTab === 'avls' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('avls')}>AVLS</button>
          <button className={activeTab === 'scheduling' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('scheduling')}>Scheduling</button>
          <button className={activeTab === 'history' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('history')}>History</button>
          <button className={activeTab === 'ims' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('ims')}>IMS</button>
          <button className={activeTab === 'cms' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('cms')}>CMS</button>
          <button className={activeTab === 'driver' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('driver')}>Driver App</button>
        </nav>

        <div className="role-panel">
          {!user ? (
            <form onSubmit={handleLogin} className="login-panel">
              <h3>Demo login</h3>
              <input
                type="text"
                value={loginForm.username}
                onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                placeholder="Username"
              />
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                placeholder="Password"
              />
              <button type="submit" className="primary-button">Login</button>
            </form>
          ) : (
            <div className="user-panel">
              <p className="label">Logged in</p>
              <strong>{user.name}</strong>
              <span>{roleLabel[user.role]}</span>
              <button className="secondary-button" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations view</p>
            <h2>{user ? roleLabel[user.role] : roleLabel[currentRole]} workspace</h2>
          </div>
          <div className="header-actions">
            <button className="ghost-button" onClick={() => setActiveTab('avls')}>Live map</button>
            {canManageScheduling && <button className="primary-button" onClick={handlePublishTomorrow}>Publish tomorrow</button>}
            <a className="ghost-button docs-link" href="/docs" target="_blank" rel="noreferrer">API docs</a>
          </div>
        </header>

        {pages[activeTab] ? pages[activeTab]() : null}
      </main>
    </div>
  );
}

export default App;
