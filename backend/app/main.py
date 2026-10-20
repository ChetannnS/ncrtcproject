from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.data import DASHBOARD, DEPOTS, DUTIES, INCIDENTS, NOTICES, ROUTES, USERS, VEHICLES

app = FastAPI(title="NCRTC Bus Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ncrtc-bms"}


@app.post("/api/login")
def login(payload: LoginRequest):
    user = next((u for u in USERS if u["username"] == payload.username), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username")
    if user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid password")

    return {
        "token": f"demo-token-{user['role']}",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "role": user["role"],
            "depot_id": user["depot_id"],
        },
    }


@app.get("/api/dashboard")
def get_dashboard():
    return DASHBOARD


@app.get("/api/depots")
def get_depots():
    return DEPOTS


@app.get("/api/vehicles")
def get_vehicles():
    return VEHICLES


@app.get("/api/routes")
def get_routes():
    return ROUTES


@app.get("/api/duties")
def get_duties():
    return DUTIES


@app.get("/api/incidents")
def get_incidents():
    return INCIDENTS


@app.get("/api/notices")
def get_notices():
    return NOTICES


@app.get("/api/users")
def get_users():
    return USERS
