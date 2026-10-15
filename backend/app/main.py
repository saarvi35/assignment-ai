"""Application entry point. Run with: uvicorn app.main:app --reload"""

from fastapi import FastAPI

from . import models  # noqa: F401  (importing registers the Task table on Base)
from .database import Base, engine
from .routes import router

# Create any missing tables when the app starts.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Management API")
app.include_router(router)
