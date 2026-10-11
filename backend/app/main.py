from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from sqlalchemy import inspect
from .database import Base, engine
from . import models
from .routers.auth import router as auth_router
from .routers.roles import router as roles_router
from .routers.admin_users import router as admin_users_router
from .routers.admin_questions import router as admin_questions_router
from .routers.quiz import router as quiz_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Poll Bazz API",
    description="Backend API for the Poll Bazz application",
    version="1.0.0",
    lifespan=lifespan,
)


# Allow the local Vite frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router)
app.include_router(roles_router)
app.include_router(admin_users_router)
app.include_router(admin_questions_router)
app.include_router(quiz_router)

@app.get("/")
def root():
    return{
        "message": "Welcome to Poll Bazz API",
        "status": "running",
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "poll-bazz-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/api/test")
def test_api():
    return{
        "success": True,
        "message": "Frontend and backend communication is working!",
        "project": "Poll Bazz",
    }

@app.get("/api/debug/database")
def database_status():
    inspector = inspect(engine)

    return {
        "database": "sqlite",
        "tables": inspector.get_table_names(),
    }

