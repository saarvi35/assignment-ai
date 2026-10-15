"""Database connection: SQLAlchemy engine, session factory, and Base class."""

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLite stores everything in a single file. Anchor it to the backend/ folder so the
# same database is used no matter which directory uvicorn is started from.
DB_PATH = Path(__file__).resolve().parent.parent / "tasks.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False lets FastAPI use the connection across its worker threads.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Each request gets its own session from this factory.
SessionLocal = sessionmaker(bind=engine, autoflush=False)

# All ORM models inherit from this; it keeps track of the tables to create.
Base = declarative_base()


def get_db():
    """FastAPI dependency: yield a session and always close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
