from fastapi import APIRouter

from models.schemas import Recommendation, RiskScoreItem, StateResponse, TrendPoint
from services.risk_service import (
    get_recommendations, get_risk_scores, get_state, get_trend,
)

router = APIRouter()


@router.get("/risk/{username}/state", response_model=StateResponse)
async def state(username: str):
    return await get_state(username)


@router.get("/risk/{username}", response_model=list[RiskScoreItem])
async def risk_scores(username: str):
    return await get_risk_scores(username)


@router.get("/risk/{username}/history", response_model=list[TrendPoint])
async def risk_history(username: str):
    return await get_trend(username)


@router.get("/recommendations/{username}", response_model=list[Recommendation])
async def recommendations(username: str):
    return await get_recommendations(username)
