from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.init_db import init_db
from app.api.v1.endpoints import auth, users, groups, expenses
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Splitwise Clone API",
    description="API for expense splitting application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow frontend origins
# Get additional origins from environment variable (comma-separated)
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add production origins from environment variable if set
cors_origins = os.getenv("CORS_ORIGINS", "")
if cors_origins:
    additional_origins = [origin.strip() for origin in cors_origins.split(",")]
    allowed_origins.extend(additional_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(groups.router, prefix="/api/v1/groups", tags=["groups"])
app.include_router(expenses.router, prefix="/api/v1/expenses", tags=["expenses"])

@app.get("/")
async def root():
    return {"message": "Welcome to Splitwise Clone API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
