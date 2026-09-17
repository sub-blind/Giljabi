from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, storyroute_bridge, day_trip
from app.api.v1.endpoints.tour import router as tour_router

api_v1_router = APIRouter()
api_v1_router.include_router(day_trip.router)
api_v1_router.include_router(health.router, tags=["health"])
api_v1_router.include_router(auth.router)
api_v1_router.include_router(
    storyroute_bridge.router,
    tags=["contract - StoryRoute OpenAPI bridge"],
)
api_v1_router.include_router(tour_router, prefix="/tour", tags=["tour"])
