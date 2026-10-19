from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.presentation.api.routes import router

BACKEND_ROOT = Path(__file__).resolve().parents[3]
PROJECT_ROOT = BACKEND_ROOT.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend"

app = FastAPI(title="e-Agro 3D Studio API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
app.mount("/storage", StaticFiles(directory=BACKEND_ROOT / "storage"), name="storage")


@app.get("/", include_in_schema=False)
def frontend_index() -> FileResponse:
    return FileResponse(FRONTEND_ROOT / "index.html", media_type="text/html")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "generator": "configured"}


# This mount is deliberately last: API and storage routes keep precedence while
# the same FastAPI process serves the ES-module frontend at the site root.
app.mount("/", StaticFiles(directory=FRONTEND_ROOT, html=True), name="frontend")
