"""지역·위치·키워드 기반 목록 — 강원 특화 기본값."""

from fastapi import APIRouter, HTTPException, Query

from app.tour_api import KorServiceOp, get_json
from app.tour_api.client import TourApiError

router = APIRouter()

# 한국관광공사 지역코드 — 명세표 기준으로 강원 맞는지 확인
DEFAULT_GANGWON_AREA_CODE = 32


@router.get("/list-by-area")
async def list_by_area(
    page_no: int = Query(1, ge=1),
    num_of_rows: int = Query(10, ge=1, le=100),
    area_code: int = Query(DEFAULT_GANGWON_AREA_CODE, description="지역코드 (강원 32 등)"),
    sigungu_code: int | None = Query(None),
) -> dict:
    """`areaBasedList2` — 지역기반 관광정보 목록."""
    extra: dict = {
        "pageNo": page_no,
        "numOfRows": num_of_rows,
        "areaCode": area_code,
    }
    if sigungu_code is not None:
        extra["sigunguCode"] = sigungu_code
    try:
        return await get_json(KorServiceOp.AREA_BASED_LIST, extra_params=extra)  # type: ignore[return-value]
    except TourApiError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e)) from e


@router.get("/list-by-keyword")
async def list_by_keyword(
    keyword: str = Query(..., min_length=1, description="검색어"),
    page_no: int = Query(1, ge=1),
    num_of_rows: int = Query(10, ge=1, le=100),
    area_code: int | None = Query(None, description="지역 제한(선택)"),
) -> dict:
    """`searchKeyword2` — 키워드 검색."""
    extra: dict = {
        "keyword": keyword,
        "pageNo": page_no,
        "numOfRows": num_of_rows,
    }
    if area_code is not None:
        extra["areaCode"] = area_code
    try:
        return await get_json(KorServiceOp.SEARCH_KEYWORD, extra_params=extra)  # type: ignore[return-value]
    except TourApiError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e)) from e
