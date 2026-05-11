"""
OmniMark AI - Backend Entry Point
AI LIBRARIES IN USE: sentence-transformers, sklearn, nltk, openai, ollama, paddleocr
MODULES: backend.auth, backend.sessions, backend.students, backend.reevaluation, backend.analytics
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.auth import router as auth_router
from backend.sessions import router as sessions_router
from backend.students import router as students_router
from backend.reevaluation import router as reevaluation_router
from backend.analytics import router as analytics_router
from backend.config import get_app_env, get_cors_allow_origins, validate_required_env

@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_required_env()
    yield

app = FastAPI(lifespan=lifespan)
app.title = "Omnimark Ai"

_app_env = get_app_env()
_cors_origins = get_cors_allow_origins()
_allow_all_origins = _app_env != "production" and not _cors_origins
_resolved_cors_origins = ["*"] if _allow_all_origins else _cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_resolved_cors_origins,
    allow_credentials=not _allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(sessions_router)
app.include_router(students_router)
app.include_router(reevaluation_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
