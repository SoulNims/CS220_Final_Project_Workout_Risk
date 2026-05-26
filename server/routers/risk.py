from fastapi import APIRouter, Header

from models.schemas import Recommendation, RiskScoreItem, StateResponse, TrendPoint
from services.auth_service import require_user_access
from services.risk_service import (
    get_recommendations, get_risk_scores, get_state, get_trend,
)

router = APIRouter()


@router.get("/risk/{username}/state", response_model=StateResponse)
async def state(username: str, authorization: str | None = Header(default=None)):
    await require_user_access(username, authorization)
    return await get_state(username)


@router.get("/risk/{username}", response_model=list[RiskScoreItem])
async def risk_scores(username: str, authorization: str | None = Header(default=None)):
    await require_user_access(username, authorization)
    return await get_risk_scores(username)


@router.get("/risk/{username}/history", response_model=list[TrendPoint])
async def risk_history(username: str, authorization: str | None = Header(default=None)):
    await require_user_access(username, authorization)
    return await get_trend(username)


@router.get("/recommendations/{username}", response_model=list[Recommendation])
async def recommendations(username: str, authorization: str | None = Header(default=None)):
    await require_user_access(username, authorization)
    return await get_recommendations(username)
