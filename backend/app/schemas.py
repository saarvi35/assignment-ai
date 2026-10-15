"""Pydantic schemas: request validation and response serialization."""

from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

TaskStatus = Literal["pending", "in_progress", "completed"]


class TaskCreate(BaseModel):
    """Body for POST /tasks."""

    # Strip whitespace first, so a title of "   " counts as empty and is rejected.
    # Unknown fields are rejected too, which catches typos like "descripton".
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: TaskStatus = "pending"


class TaskUpdate(BaseModel):
    """Body for PUT/PATCH /tasks/{id}. Every field is optional; send only what changes."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[TaskStatus] = None

    @field_validator("title", "status")
    @classmethod
    def not_null(cls, value):
        # Omitting a field is fine, but explicitly sending null would wipe a required column.
        if value is None:
            raise ValueError("cannot be null; omit the field to leave it unchanged")
        return value


class TaskRead(BaseModel):
    """Shape of a task in responses."""

    # from_attributes lets Pydantic read values straight off a SQLAlchemy Task object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def assume_utc(cls, value: datetime) -> datetime:
        # SQLite drops timezone info, so values come back naive. We always store UTC,
        # so tag it; otherwise clients may read the timestamp as local time.
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
