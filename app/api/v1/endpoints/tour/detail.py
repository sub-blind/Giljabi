"""콘텐츠 ID 기반 상세 — 공통·소개·이미지 등."""

from fastapi import APIRouter, HTTPException, Query

from app.tour_api import KorServiceOp, get_json
from app.tour_api.client import TourApiError

router = APIRouter(prefix="/detail")


@router.get("/common")
async def detail_common(
    content_id: int = Query(..., description="콘텐츠 ID"),
    content_type_id: int = Query(..., description="콘텐츠 타입 ID (명세 참고)"),
) -> dict:
    """`detailCommon2` — 공통정보."""
    try:
        return await get_json(
            KorServiceOp.DETAIL_COMMON,
            extra_params={"contentId": content_id, "contentTypeId": content_type_id},
        )  # type: ignore[return-value]
    except TourApiError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e)) from e


@router.get("/intro")
async def detail_intro(
    content_id: int = Query(...),
    content_type_id: int = Query(...),
) -> dict:
    """`detailIntro2` — 소개정보."""
    try:
        return await get_json(
            KorServiceOp.DETAIL_INTRO,
            extra_params={"contentId": content_id, "contentTypeId": content_type_id},
        )  # type: ignore[return-value]
    except TourApiError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e)) from e
