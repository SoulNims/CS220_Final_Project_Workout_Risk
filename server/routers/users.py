from fastapi import APIRouter, Header

from models.schemas import (
    AuthRequest, AuthResponse, ForgotPasswordRequest,
    RegisterRequest, SecurityQuestionResponse, UserResponse, UserUpdate,
)
from services.auth_service import (
    get_security_question, login_user, register_user, require_user_access, reset_password,
)
from services.user_service import get_user, update_user

router = APIRouter()


@router.post("/auth/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest):
    return await register_user(
        body.email, body.password, body.first_name, body.last_name,
        body.security_question, body.security_answer,
    )


@router.get("/auth/security-question/{email:path}", response_model=SecurityQuestionResponse)
async def security_question(email: str):
    question = await get_security_question(email)
    return {"question": question}


@router.post("/auth/forgot-password", response_model=AuthResponse)
async def forgot_password(body: ForgotPasswordRequest):
    return await reset_password(body.email, body.security_answer, body.new_password)


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
