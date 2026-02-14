import logging
import os
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

# Configure structured logging for the entire backend
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)

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
# Request Correlation ID Middleware
# ---------------------------------------------------------------------------
_correlation_logger = logging.getLogger("featune.request")


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique X-Request-ID to every request/response for tracing."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        _correlation_logger.info(
            "%s %s request_id=%s", request.method, request.url.path, request_id
        )
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


app.add_middleware(CorrelationIDMiddleware)


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
    """Return service health status, including dependency checks."""
    checks: dict[str, str] = {}

    # Check Supabase connectivity
    try:
        from supabase import create_client
        url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if url and key:
            sb = create_client(url, key)
            sb.table("tracks").select("id").limit(1).execute()
            checks["supabase"] = "ok"
        else:
            checks["supabase"] = "not_configured"
    except Exception:
        checks["supabase"] = "error"

    # Check Anthropic API key is set
    if os.getenv("ANTHROPIC_API_KEY"):
        checks["anthropic"] = "ok"
    else:
        checks["anthropic"] = "not_configured"

    # Overall status: degraded if any dependency is in error
    overall = "ok"
    if any(v == "error" for v in checks.values()):
        overall = "degraded"

    from fastapi.responses import JSONResponse
    status_code = 200 if overall == "ok" else 503
    return JSONResponse(
        content={"status": overall, "checks": checks},
        status_code=status_code,
    )
