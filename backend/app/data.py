DEPOTS = [
    {
        "id": 1,
        "name": "Noida Sec-37",
        "region": "Noida",
        "lat": 28.5683,
        "lng": 77.3279,
        "polygon": [
            [28.562, 77.320], [28.575, 77.320], [28.575, 77.339], [28.562, 77.339]
        ],
    },
    {
        "id": 2,
        "name": "Anand Vihar",
        "region": "Delhi",
        "lat": 28.6484,
        "lng": 77.3168,
        "polygon": [
            [28.642, 77.308], [28.656, 77.308], [28.656, 77.327], [28.642, 77.327]
        ],
    },
    {
        "id": 3,
        "name": "Ghaziabad Hub",
        "region": "UP",
        "lat": 28.6692,
        "lng": 77.4538,
        "polygon": [
            [28.661, 77.445], [28.679, 77.445], [28.679, 77.468], [28.661, 77.468]
        ],
    },
]

VEHICLES = [
    {"id": 1, "registration": "DL1AB1234", "depot_id": 1, "route_id": 1, "driver_id": 1, "status": "on-time", "lat": 28.5661, "lng": 77.3317, "speed": 32},
    {"id": 2, "registration": "DL1AB5678", "depot_id": 1, "route_id": 2, "driver_id": 2, "status": "late", "lat": 28.5715, "lng": 77.3341, "speed": 26},
    {"id": 3, "registration": "DL1CD9911", "depot_id": 2, "route_id": 3, "driver_id": 3, "status": "idle", "lat": 28.6492, "lng": 77.3188, "speed": 0},
    {"id": 4, "registration": "DL1EF2255", "depot_id": 2, "route_id": 4, "driver_id": 4, "status": "on-time", "lat": 28.6468, "lng": 77.3127, "speed": 41},
    {"id": 5, "registration": "DL1GH3344", "depot_id": 3, "route_id": 5, "driver_id": 5, "status": "on-time", "lat": 28.6734, "lng": 77.4588, "speed": 35},
]

USERS = [
    {"id": 1, "username": "admin1", "password": "password", "role": "admin", "name": "Priya Sharma", "depot_id": 1},
    {"id": 2, "username": "manager1", "password": "password", "role": "depot_manager", "name": "Rohit Verma", "depot_id": 1},
    {"id": 3, "username": "ops1", "password": "password", "role": "control_room", "name": "Sonia Mehta", "depot_id": 1},
    {"id": 4, "username": "driver1", "password": "password", "role": "driver", "name": "Aman Singh", "depot_id": 1},
    {"id": 5, "username": "exec1", "password": "password", "role": "executive", "name": "Gaurav Nair", "depot_id": 1},
]

ROUTES = [
    {"id": 1, "name": "Noida City Loop", "depot_id": 1, "stops": [
        {"name": "Noida Sec-37", "eta": "06:15"},
        {"name": "Sector 62", "eta": "06:35"},
        {"name": "Botanical Garden", "eta": "06:55"},
        {"name": "Dwarka Sector 21", "eta": "07:30"}
    ]},
    {"id": 2, "name": "Anand Vihar Connector", "depot_id": 2, "stops": [
        {"name": "Anand Vihar", "eta": "07:10"},
        {"name": "Karkardooma", "eta": "07:25"},
        {"name": "Preet Vihar", "eta": "07:40"},
        {"name": "Mayur Vihar", "eta": "08:05"}
    ]},
    {"id": 3, "name": "Ghaziabad Transit", "depot_id": 3, "stops": [
        {"name": "Ghaziabad Hub", "eta": "06:45"},
        {"name": "Raj Nagar", "eta": "07:00"},
        {"name": "Indirapuram", "eta": "07:25"},
        {"name": "Vaishali", "eta": "07:45"}
    ]},
    {"id": 4, "name": "Metro Feeder East", "depot_id": 2, "stops": [
        {"name": "Anand Vihar", "eta": "08:00"},
        {"name": "Shahdara", "eta": "08:15"},
        {"name": "Patparganj", "eta": "08:40"},
        {"name": "Nirman Vihar", "eta": "09:05"}
    ]},
    {"id": 5, "name": "Noida Airport Link", "depot_id": 1, "stops": [
        {"name": "Noida Sec-37", "eta": "08:30"},
        {"name": "NSEZ", "eta": "08:55"},
        {"name": "Yamuna Expressway", "eta": "09:20"},
        {"name": "Airport", "eta": "09:50"}
    ]}
]

DUTIES = [
    {"id": 1, "driver_id": 4, "vehicle_id": 1, "route_id": 1, "day": "today", "status": "published", "start_time": "06:15"},
    {"id": 2, "driver_id": 5, "vehicle_id": 2, "route_id": 2, "day": "today", "status": "acknowledged", "start_time": "07:10"},
    {"id": 3, "driver_id": 1, "vehicle_id": 3, "route_id": 3, "day": "tomorrow", "status": "draft", "start_time": "06:45"},
]

INCIDENTS = [
    {"id": 1, "type": "breakdown", "severity": "P1", "status": "open", "description": "Bus stalled near Sector 62 stop.", "vehicle_id": 1, "depot_id": 1, "assigned_to": "ops1", "created_at": "2026-10-18T08:12:00Z"},
    {"id": 2, "type": "complaint", "severity": "P2", "status": "in_progress", "description": "Passenger reported AC issue on route 2.", "vehicle_id": 2, "depot_id": 1, "assigned_to": "manager1", "created_at": "2026-10-18T09:25:00Z"},
    {"id": 3, "type": "accident", "severity": "P3", "status": "resolved", "description": "Minor door scrape during boarding.", "vehicle_id": 4, "depot_id": 2, "assigned_to": "ops1", "created_at": "2026-10-17T16:08:00Z"},
]

NOTICES = [
    {"id": 1, "title": "Driver briefing", "body": "Please review today's depot briefing before trip start.", "audience": "all_drivers", "published_at": "2026-10-18T06:00:00Z", "read_by": ["driver1"]},
    {"id": 2, "title": "Route diversion alert", "body": "Noida Sector 62 route is temporarily rerouted for maintenance.", "audience": "depot_1", "published_at": "2026-10-18T07:05:00Z", "read_by": []},
    {"id": 3, "title": "Safety reminder", "body": "All drivers must confirm the daily inspection checklist.", "audience": "all_drivers", "published_at": "2026-10-17T18:30:00Z", "read_by": ["driver1", "manager1"]},
]

PING_HISTORY = [
    {"vehicle_id": 1, "lat": 28.5661, "lng": 77.3317, "ts": "2026-10-18T06:15:00Z", "speed": 32},
    {"vehicle_id": 1, "lat": 28.5670, "lng": 77.3330, "ts": "2026-10-18T06:20:00Z", "speed": 30},
    {"vehicle_id": 1, "lat": 28.5680, "lng": 77.3345, "ts": "2026-10-18T06:25:00Z", "speed": 29},
    {"vehicle_id": 2, "lat": 28.5715, "lng": 77.3341, "ts": "2026-10-18T06:40:00Z", "speed": 22},
    {"vehicle_id": 2, "lat": 28.5730, "lng": 77.3362, "ts": "2026-10-18T06:45:00Z", "speed": 25},
    {"vehicle_id": 2, "lat": 28.5745, "lng": 77.3388, "ts": "2026-10-18T06:50:00Z", "speed": 26},
]

DASHBOARD = {
    "total_vehicles": len(VEHICLES),
    "active_routes": len(ROUTES),
    "open_incidents": 2,
    "notices": len(NOTICES),
}
