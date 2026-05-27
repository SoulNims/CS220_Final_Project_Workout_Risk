from typing import Literal, Optional

from pydantic import BaseModel, Field

MuscleGroup = Literal[
    "head", "chest", "abs", "obliques", "upper_back", "lower_back",
    "glutes", "shoulders_front", "shoulders_rear", "biceps", "triceps",
    "forearms_l", "forearms_r", "quads", "hamstrings", "calves",
]

MUSCLE_GROUPS: tuple[str, ...] = (
    "head", "chest", "abs", "obliques", "upper_back", "lower_back",
    "glutes", "shoulders_front", "shoulders_rear", "biceps", "triceps",
    "forearms_l", "forearms_r", "quads", "hamstrings", "calves",
)

RiskLevel = Literal["none", "low", "mod", "high", "crit"]


# ── Users ────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    username: str
    email: Optional[str] = None
    first_name: str = ""
    last_name: str = ""
    gender: str
    age: Optional[int] = None


class AuthRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(AuthRequest):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    security_question: str = Field(min_length=1, max_length=200)
    security_answer: str = Field(min_length=1, max_length=200)


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class SecurityQuestionResponse(BaseModel):
    question: str


class ForgotPasswordRequest(BaseModel):
    email: str
    security_answer: str
    new_password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    gender: Optional[str] = None
    age: Optional[int] = None


class NoteResponse(BaseModel):
    username: str
    body: str = ""
    updated_at: Optional[str] = None


class NoteUpdate(BaseModel):
    body: str = Field(default="", max_length=5000)


# ── Sessions ─────────────────────────────────────────────────────────────────

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
    groups: list[MuscleGroup]
    rpe: int = Field(ge=1, le=10)
    duration: int = Field(gt=0)
    soreness: int = Field(ge=1, le=10, default=5)
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


# ── Risk ─────────────────────────────────────────────────────────────────────

class RiskEntry(BaseModel):
    level: RiskLevel
    score: int


class RiskScoreItem(BaseModel):
    group: str
    level: RiskLevel
    score: int


class TrendPoint(BaseModel):
    d: str
    score: int


class StateResponse(BaseModel):
    loads: dict[str, float]
    risk: dict[str, RiskEntry]
    aggregate_score: int
    trend: list[TrendPoint]


class Recommendation(BaseModel):
    group: str
    level: RiskLevel
    score: int
    message: str


# ── AI ───────────────────────────────────────────────────────────────────────

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


class AICoachResponse(BaseModel):
    analysis: SmartWorkoutAnalysis
    plan: WorkoutPlanResponse
    report: WeeklyHealthReport
