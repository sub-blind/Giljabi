"""지역코드·카테고리 코드 등 ‘메타’ 오퍼레이션."""

from fastapi import APIRouter, HTTPException, Query

from app.tour_api import KorServiceOp, get_json
from app.tour_api.client import TourApiError

router = APIRouter(prefix="/codes")


@router.get("/areas")
async def area_codes(
    num_of_rows: int = Query(100, ge=1, le=1000),
    page_no: int = Query(1, ge=1),
) -> dict:
    """`areaCode2` — 시·도 코드 목록."""
    try:
        return await get_json(
            KorServiceOp.AREA_CODE_LIST,
            extra_params={"numOfRows": num_of_rows, "pageNo": page_no},
        )  # type: ignore[return-value]
    except TourApiError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e)) from e


@router.get("/categories")
async def category_codes(
    num_of_rows: int = Query(100, ge=1, le=1000),
    page_no: int = Query(1, ge=1),
) -> dict:
    """`categoryCode2` — 대/중/소 분류 코드 (파라미터는 명세에 맞게 확장)."""
    try:
        return await get_json(
            KorServiceOp.CATEGORY_CODE_LIST,
            extra_params={"numOfRows": num_of_rows, "pageNo": page_no},
        )  # type: ignore[return-value]
    except TourApiError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e)) from e
