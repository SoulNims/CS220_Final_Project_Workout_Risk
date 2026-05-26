from fastapi import APIRouter, Response, status

from models.schemas import SessionCreate, SessionResponse
from services.workout_service import (
    create_session, delete_session, get_sessions, update_session,
)

router = APIRouter()


@router.get("/workouts/{username}", response_model=list[SessionResponse])
async def list_sessions(username: str):
    return await get_sessions(username)


@router.post("/workouts/{username}", response_model=SessionResponse, status_code=201)
async def post_session(username: str, body: SessionCreate):
    return await create_session(username, body)


@router.put("/workouts/{username}/{session_id}", response_model=SessionResponse)
async def put_session(username: str, session_id: str, body: SessionCreate):
    return await update_session(username, session_id, body)


@router.delete("/workouts/{username}/{session_id}", status_code=204)
async def remove_session(username: str, session_id: str):
    await delete_session(username, session_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
