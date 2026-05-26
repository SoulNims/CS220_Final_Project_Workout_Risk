from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

MuscleGroup = Literal[
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "quads",
    "hamstrings",
    "glutes",
    "calves",
    "core",
]

RiskLevel = Literal["Low", "Moderate", "High", "Critical"]
RiskColor = Literal["gray", "green", "yellow", "orange", "red"]

MUSCLE_GROUPS: tuple[str, ...] = (
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "quads",
    "hamstrings",
    "glutes",
    "calves",
    "core",
)


class UserResponse(BaseModel):
    username: str
    created_at: datetime


class WorkoutCreate(BaseModel):
    muscle_group: MuscleGroup
    sets: int = Field(gt=0, le=50)
    reps: int = Field(gt=0, le=200)
    intensity: float = Field(ge=0, le=100)


class WorkoutResponse(BaseModel):
    id: str
    username: str
    muscle_group: MuscleGroup
    sets: int
    reps: int
    intensity: float
    logged_at: datetime


class RiskScore(BaseModel):
    muscle_group: MuscleGroup
    score: float
    level: RiskLevel
    color: RiskColor


class RiskSnapshot(BaseModel):
    timestamp: datetime
    scores: list[RiskScore]


class Recommendation(BaseModel):
    muscle_group: MuscleGroup
    score: float
    level: RiskLevel
    color: RiskColor
    message: str


class SmartWorkoutAnalysis(BaseModel):
    source: Literal["gemini", "demo"]
    patterns: list[str]
    risk_notes: list[str]
    focus_area: str
    disclaimer: str


class WorkoutPlanDay(BaseModel):
    day: str
    focus: str
    exercises: list[str]
    reason: str


class WorkoutPlanResponse(BaseModel):
    source: Literal["gemini", "demo"]
    plan: list[WorkoutPlanDay]
    disclaimer: str


class WeeklyHealthReport(BaseModel):
    source: Literal["gemini", "demo"]
    title: str
    summary: str
    trend: str
    focus: str
    disclaimer: str
