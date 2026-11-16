"""
Vercel Serverless Entrypoint — MindCare API
=============================================
Vercel's Python runtime resolves the FastAPI ASGI application from this file.
The variable MUST be named `app`.

Architecture:
  Vercel invocation → api/index.py (this file)
                    → sys.path insert of ../backend
                    → from main import app (FastAPI)
                    → Vercel ASGI handler serves all /api/* routes
"""

import sys
import os

# ── Path & working-directory setup ────────────────────────────────────────────
# Resolve the absolute path of the repo root and backend directory.
_THIS_FILE  = os.path.abspath(__file__)                        # .../api/index.py
_API_DIR    = os.path.dirname(_THIS_FILE)                      # .../api/
_REPO_ROOT  = os.path.dirname(_API_DIR)                        # .../Mental-Health-Monitoring/
_BACKEND    = os.path.join(_REPO_ROOT, "backend")              # .../backend/

# Insert backend/ at the front so `from app.core.config import settings` etc. resolve.
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

# Change cwd to backend/ so all relative file paths used by the app
# (e.g. DISTILBERT_MODEL_PATH = "app/ai_models/distilbert") work correctly.
os.chdir(_BACKEND)

# ── Signal Vercel environment to backend code ─────────────────────────────────
# This env var is used by voice.py and reports.py to adapt to serverless limits.
os.environ.setdefault("VERCEL", "1")

# ── Import FastAPI application ─────────────────────────────────────────────────
from main import app  # noqa: E402  — must come after sys.path / chdir setup

# `app` is the FastAPI ASGI instance that Vercel will serve.
