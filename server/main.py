from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.ai import router as ai_router
from routers.risk import router as risk_router
from routers.users import router as users_router
from routers.workouts import router as workouts_router

app = FastAPI(
    title="InjuryGuard API",
    description="AI-powered injury risk predictor for CS 220.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(workouts_router, prefix="/api", tags=["workouts"])
app.include_router(risk_router, prefix="/api", tags=["risk"])
app.include_router(ai_router, prefix="/api", tags=["ai"])


@app.get("/")
def read_root():
    return {"message": "Welcome to InjuryGuard API"}
