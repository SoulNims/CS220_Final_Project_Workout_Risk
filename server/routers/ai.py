from fastapi import APIRouter

from models.schemas import (
    AICoachResponse,
    SmartWorkoutAnalysis,
    WeeklyHealthReport,
    WorkoutPlanResponse,
)
from services.ai_service import (
    get_ai_coach,
    get_smart_analysis,
    get_weekly_report,
    get_workout_plan,
)

router = APIRouter()


@router.get("/ai/coach/{username}", response_model=AICoachResponse)
async def ai_coach(username: str, force: bool = False):
    return await get_ai_coach(username, force=force)


@router.get("/ai/analyze/{username}", response_model=SmartWorkoutAnalysis)
async def smart_workout_analysis(username: str):
    return await get_smart_analysis(username)


@router.get("/ai/plan/{username}", response_model=WorkoutPlanResponse)
async def workout_plan(username: str):
    return await get_workout_plan(username)


@router.get("/ai/report/{username}", response_model=WeeklyHealthReport)
async def weekly_health_report(username: str):
    return await get_weekly_report(username)
