from fastapi import APIRouter

from models.schemas import Recommendation, RiskScore, RiskSnapshot
from services.risk_service import (
    calculate_risk_scores,
    get_recommendations,
    get_risk_history,
)

router = APIRouter()


@router.get("/risk/{username}", response_model=list[RiskScore])
def risk_scores(username: str):
    return calculate_risk_scores(username)


@router.get("/risk/{username}/history", response_model=list[RiskSnapshot])
def risk_history(username: str):
    return get_risk_history(username)


@router.get("/recommendations/{username}", response_model=list[Recommendation])
def recommendations(username: str):
    return get_recommendations(username)
