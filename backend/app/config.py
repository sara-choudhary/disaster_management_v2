import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./network_emergency.db")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
