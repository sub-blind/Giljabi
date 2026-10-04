from fastapi import APIRouter

from app.api.v1.endpoints import account_courses, auth, health, day_trip

api_v1_router = APIRouter()
api_v1_router.include_router(day_trip.router)
api_v1_router.include_router(health.router, tags=["health"])
api_v1_router.include_router(auth.router)
api_v1_router.include_router(account_courses.router)
