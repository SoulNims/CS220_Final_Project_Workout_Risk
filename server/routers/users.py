from fastapi import APIRouter, Header

from models.schemas import AuthRequest, AuthResponse, RegisterRequest, UserResponse, UserUpdate
from services.auth_service import login_user, register_user, require_user_access
from services.user_service import get_user, update_user

router = APIRouter()


@router.post("/auth/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest):
    return await register_user(body.email, body.password, body.first_name, body.last_name)


@router.post("/auth/login", response_model=AuthResponse)
async def login(body: AuthRequest):
    return await login_user(body.email, body.password)


@router.get("/users/{username}", response_model=UserResponse)
async def read_user(username: str, authorization: str | None = Header(default=None)):
    await require_user_access(username, authorization)
    return await get_user(username)


@router.patch("/users/{username}", response_model=UserResponse)
async def patch_user(
    username: str,
    body: UserUpdate,
    authorization: str | None = Header(default=None),
):
    await require_user_access(username, authorization)
    return await update_user(username, body.gender, body.age)
