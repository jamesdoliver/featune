import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FEATUNE API",
    description="Audio processing and AI chat service for FEATUNE",
    version="0.1.0",
)

# CORS configuration
# Set FRONTEND_URL environment variable in production (e.g., https://featune.com)
frontend_url = os.getenv("FRONTEND_URL")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if frontend_url:
    origins.append(frontend_url)
else:
    # Only allow all origins in development when FRONTEND_URL is not set
    origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from app.routers import process, chat

app.include_router(process.router, prefix="/process", tags=["processing"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health_check():
    """Return service health status."""
    return {"status": "ok"}
