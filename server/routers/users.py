from fastapi import APIRouter

from models.schemas import UserResponse
from services.user_service import get_or_create_user

router = APIRouter()


@router.get("/users/{username}", response_model=UserResponse)
def get_user(username: str):
    return get_or_create_user(username)
