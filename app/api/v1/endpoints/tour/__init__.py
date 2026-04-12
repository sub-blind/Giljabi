from fastapi import APIRouter

from app.api.v1.endpoints.tour import area, detail, meta

router = APIRouter()
router.include_router(meta.router, tags=["tour — 코드"])
router.include_router(area.router, tags=["tour — 지역·검색"])
router.include_router(detail.router, tags=["tour — 상세"])
