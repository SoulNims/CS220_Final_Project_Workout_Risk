from fastapi import APIRouter

from models.schemas import SmartWorkoutAnalysis, WeeklyHealthReport, WorkoutPlanResponse
from services.ai_service import get_smart_analysis, get_weekly_report, get_workout_plan

router = APIRouter()


@router.get("/ai/analyze/{username}", response_model=SmartWorkoutAnalysis)
def smart_workout_analysis(username: str):
    return get_smart_analysis(username)


@router.get("/ai/plan/{username}", response_model=WorkoutPlanResponse)
def workout_plan(username: str):
    return get_workout_plan(username)


@router.get("/ai/report/{username}", response_model=WeeklyHealthReport)
def weekly_health_report(username: str):
    return get_weekly_report(username)
