from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import close_db, init_db
from routers.ai import router as ai_router
from routers.risk import router as risk_router
from routers.users import router as users_router
from routers.workouts import router as workouts_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Tendon API",
    description="AI-powered injury risk predictor for CS 220.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(workouts_router, prefix="/api", tags=["workouts"])
app.include_router(risk_router, prefix="/api", tags=["risk"])
app.include_router(ai_router, prefix="/api", tags=["ai"])


@app.get("/")
def read_root():
    return {"message": "Tendon API is running"}
