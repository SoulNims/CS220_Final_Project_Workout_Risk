from fastapi import APIRouter

from models.schemas import UserResponse, UserUpdate
from services.user_service import get_or_create_user, update_user

router = APIRouter()


@router.get("/users/{username}", response_model=UserResponse)
async def get_user(username: str):
    return await get_or_create_user(username)


@router.patch("/users/{username}", response_model=UserResponse)
async def patch_user(username: str, body: UserUpdate):
    return await update_user(username, body.gender, body.age)
