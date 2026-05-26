from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    username: str
    gender: Optional[str] = ""
    age: Optional[int] = None


class UserUpdate(BaseModel):
    gender: Optional[str] = None
    age: Optional[int] = None


class UserResponse(BaseModel):
    username: str
    gender: str
    age: Optional[int] = None


class SetRow(BaseModel):
    rpe: int
    weight: Optional[str] = None
    reps: Optional[str] = None


class EntryItem(BaseModel):
    group: str
    fields: list[str] = []
    setRows: list[SetRow] = []


class SessionCreate(BaseModel):
    date: str
    name: str
    groups: list[str]
    rpe: int
    duration: int
    soreness: int = 5
    entries: Optional[list[EntryItem]] = None


class SessionResponse(BaseModel):
    id: str
    username: str
    date: str
    name: str
    groups: list[str]
    rpe: int
    duration: int
    soreness: int
    entries: Optional[list] = None


class RiskEntry(BaseModel):
    level: str
    score: int


class TrendPoint(BaseModel):
    d: str
    score: int


class StateResponse(BaseModel):
    loads: dict[str, float]
    risk: dict[str, RiskEntry]
    aggregate_score: int
    trend: list[TrendPoint]


class MuscleResponse(BaseModel):
    group: str
    load: float
    level: str
    score: int
    recommendation: str
    recent_sessions: list[SessionResponse]
