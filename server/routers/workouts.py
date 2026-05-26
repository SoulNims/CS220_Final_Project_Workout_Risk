from fastapi import APIRouter, Response, status

from models.schemas import WorkoutCreate, WorkoutResponse
from services.workout_service import create_workout, delete_workout, get_workouts

router = APIRouter()


@router.post(
    "/workouts/{username}",
    response_model=WorkoutResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_workout(username: str, workout: WorkoutCreate):
    return create_workout(username, workout)


@router.get("/workouts/{username}", response_model=list[WorkoutResponse])
def list_workouts(username: str):
    return get_workouts(username)


@router.delete("/workouts/{username}/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_workout(username: str, workout_id: str):
    delete_workout(username, workout_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
