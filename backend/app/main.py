import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.routers import (
    network,
    simulations,
    traffic,
    security,
    events_alerts,
    reports,
)
from app.services.websocket import ws_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("network_emergency")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed default records idempotently
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        logger.info("Seeding default network topology and configuration...")
        seed_database(db)
        logger.info("Database initialization complete.")
    finally:
        db.close()
    yield
    # Shutdown logic if any
    logger.info("Shutting down network emergency service...")


app = FastAPI(
    title="Disaster-Resistant Emergency Communication Network with Priority Routing",
    description=(
        "Academic, resume-quality full-stack platform demonstrating redundant ring topology, "
        "alternate-path routing, priority queuing (QoS), failure recovery simulation, "
        "and departmental access control during disaster conditions."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local frontend development on any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "Disaster-Resistant Emergency Communication Network",
        "version": "1.0.0",
        "topology": "4-Router Ring + Mesh Redundancy",
        "departments_supported": 7,
    }


# Include Versioned Routers under /api/v1
api_v1_prefix = "/api/v1"
app.include_router(network.router, prefix=api_v1_prefix)
app.include_router(simulations.router, prefix=api_v1_prefix)
app.include_router(traffic.router, prefix=api_v1_prefix)
app.include_router(security.router, prefix=api_v1_prefix)
app.include_router(events_alerts.router, prefix=api_v1_prefix)
app.include_router(reports.router, prefix=api_v1_prefix)


# WebSocket Endpoint for Live Network Events
@app.websocket("/ws/network-events")
async def websocket_network_events(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive loop
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
