"""
StoryRoute 계약(openapi)과 호환되는 얇은 게이트 — 기존 TourAPI 어댑터를 재사용.
placeId: "{contentTypeId}_{contentId}" (예: 12_1234567)
"""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.tour_api import KorServiceOp, get_json
from app.tour_api.client import TourApiError

router = APIRouter()

DEFAULT_GANGWON_AREA_CODE = 32


def _extract_list_items(data: dict[str, Any]) -> list[dict[str, Any]]:
    try:
        body = data["response"]["body"]
        items_wrap = body.get("items") or {}
        raw = items_wrap.get("item")
    except (KeyError, TypeError):
        return []
    if raw is None:
        return []
    if isinstance(raw, list):
        return [x for x in raw if isinstance(x, dict)]
    if isinstance(raw, dict):
        return [raw]
    return []


def _extract_total_count(data: dict[str, Any]) -> int:
    try:
        tc = data["response"]["body"].get("totalCount")
        return int(tc) if tc is not None else 0
    except (KeyError, TypeError, ValueError):
        return 0


def _parse_place_id(place_id: str) -> tuple[int, int]:
    place_id = place_id.strip()
    m = re.match(r"^(\d+)[_\-](\d+)$", place_id)
    if not m:
        raise HTTPException(
            status_code=400,
            detail="placeId는 {contentTypeId}_{contentId} 형식이어야 합니다.",
        )
    return int(m.group(1)), int(m.group(2))


def _item_title(item: dict[str, Any]) -> str:
    t = item.get("title")
    return str(t).strip() if t else "이름 없음"


def _place_id_from_item(item: dict[str, Any]) -> str:
    ct = item.get("contenttypeid")
    cid = item.get("contentid")
    return f"{ct}_{cid}" if ct is not None and cid is not None else str(cid or "unknown")


def _region_label_for_area(area_code: int | None) -> str:
    if area_code == 32:
        return "강원특별자치도"
    if area_code is None:
        return "강원특별자치도"
    return f"지역코드 {area_code}"


def _marker_coords(item: dict[str, Any]) -> tuple[float, float]:
    try:
        x = float(str(item.get("mapx") or "0"))
        y = float(str(item.get("mapy") or "0"))
        if x == 0 and y == 0:
            return 37.5665, 126.9780
        return y, x
    except (TypeError, ValueError):
        return 37.5665, 126.9780


def _detail_item_body(data: dict[str, Any]) -> dict[str, Any] | None:
    try:
        raw = data["response"]["body"]["items"]["item"]
    except (KeyError, TypeError):
        return None
    if isinstance(raw, list) and raw:
        return raw[0] if isinstance(raw[0], dict) else None
    if isinstance(raw, dict):
        return raw
    return None


@router.get("/search")
async def contract_search(
    q: str = Query(..., min_length=1),
    region: str | None = None,
    companion: str | None = None,
    duration: str | None = None,
    pet: bool | None = None,
    accessibility: bool | None = None,
    page_no: int = Query(1, ge=1),
    num_of_rows: int = Query(20, ge=1, le=100),
    area_code: int | None = Query(
        None,
        description="미입력 시 강원(32) 키워드 검색에 지역 제한",
    ),
) -> dict[str, Any]:
    """OpenAPI `GET /v1/search` — 키워드 검색을 우선 사용(의미검색은 추후 M3)."""
    _ = (companion, duration, pet, accessibility)

    ac = area_code if area_code is not None else DEFAULT_GANGWON_AREA_CODE
    if region and area_code is None:
        if "강원" in region or region.lower() in ("gangwon", "gw"):
            ac = DEFAULT_GANGWON_AREA_CODE

    extra: dict = {
        "keyword": q,
        "pageNo": page_no,
        "numOfRows": num_of_rows,
        "areaCode": ac,
    }
    try:
        raw = await get_json(KorServiceOp.SEARCH_KEYWORD, extra_params=extra)
    except TourApiError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e)) from e

    if not isinstance(raw, dict):
        raise HTTPException(status_code=502, detail="TourAPI 응답 형식 오류")

    items_in = _extract_list_items(raw)
    total = _extract_total_count(raw) or len(items_in)
    region_label = _region_label_for_area(ac)

    place_cards = []
    markers = []
    for it in items_in:
        pid = _place_id_from_item(it)
        title = _item_title(it)
        overview = (it.get("overview") or it.get("desc") or it.get("addr1") or "")[:500]
        cat = str(it.get("contenttypeid") or "tour")
        place_cards.append(
            {
                "placeId": pid,
                "title": title,
                "region": region_label,
                "category": cat,
                "summary": overview or f"{title} — 관광공사 정보",
                "thumbnailUrl": it.get("firstimage2") or it.get("firstimage"),
                "reason": {
                    "tags": ["키워드 검색", "TourAPI"],
                    "sentence": f"「{q}」 조건에 맞는 관광공사 소개 정보입니다.",
                },
            }
        )
        lat, lng = _marker_coords(it)
        markers.append({"placeId": pid, "lat": lat, "lng": lng, "title": title})

    return {
        "query": q,
        "total": total,
        "items": place_cards,
        "markers": markers,
    }


@router.get("/places/{place_id}")
async def contract_place_detail(place_id: str) -> dict[str, Any]:
    content_type_id, content_id = _parse_place_id(place_id)
    try:
        raw = await get_json(
            KorServiceOp.DETAIL_COMMON,
            extra_params={"contentId": content_id, "contentTypeId": content_type_id},
        )
    except TourApiError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e)) from e

    if not isinstance(raw, dict):
        raise HTTPException(status_code=502, detail="TourAPI 응답 형식 오류")

    item = _detail_item_body(raw)
    if not item:
        raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")

    title = _item_title(item)
    addr = str(item.get("addr1") or item.get("addr2") or "")
    overview = str(item.get("overview") or item.get("homepage") or "")[:2000]
    assets = []
    img = item.get("firstimage") or item.get("firstimage2")
    if img and str(img).startswith("http"):
        assets.append({"kind": "image", "url": str(img), "title": title})

    return {
        "placeId": f"{content_type_id}_{content_id}",
        "title": title,
        "region": _region_label_for_area(DEFAULT_GANGWON_AREA_CODE),
        "category": str(item.get("contenttypeid") or content_type_id),
        "address": addr,
        "summary": overview[:800] if overview else f"{title} 상세 정보",
        "story": overview or "",
        "assets": assets,
        "nearby": [],
    }


@router.post("/planner/preview")
async def contract_planner_preview(body: dict[str, Any]) -> dict[str, Any]:
    """M3 이전 스텁 — 스키마만 맞춤."""
    q = str(body.get("query") or "")
    _ = body.get("constraints") or {}
    return {
        "draftId": str(uuid.uuid4()),
        "title": "일정 초안 (스텁)",
        "summary": f"「{q}」 기준으로 생성 예정인 일정입니다. 플래너 로직 연동 전입니다.",
        "stops": [
            {
                "dayNo": 1,
                "stopOrder": 1,
                "timeLabel": "오전",
                "placeId": "stub_0",
                "placeTitle": "장소를 검색에서 추가하세요",
                "stayMinutes": 60,
                "reason": "MVP 스텁 응답입니다.",
            }
        ],
    }


@router.get("/itineraries")
async def contract_list_itineraries() -> dict[str, Any]:
    return {"items": []}


@router.post("/itineraries", status_code=201)
async def contract_create_itinerary(body: dict[str, Any]) -> dict[str, Any]:
    now = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    iid = str(uuid.uuid4())
    stops = body.get("stops") or []
    return {
        "itineraryId": iid,
        "title": str(body.get("title") or "나의 일정"),
        "region": "강원특별자치도",
        "savedAt": now,
        "stops": stops,
    }


@router.post("/events", status_code=202)
async def contract_events(body: dict[str, Any]) -> dict[str, Any]:
    _ = body
    return {"accepted": True}


@router.get("/regions/{slug}")
async def contract_region_landing(slug: str) -> dict[str, Any]:
    if slug in ("gangwon", "32", "강원"):
        hero_title = "강원 여행"
        hero_sub = "관광공사 데이터로 이어 보는 코스"
        top = ["휴양", "자연", "맛집"]
    else:
        hero_title = f"{slug} 지역"
        hero_sub = "지역 랜딩 (스텁)"
        top = ["당일치기", "1박2일"]

    return {
        "slug": slug,
        "heroTitle": hero_title,
        "heroSubtitle": hero_sub,
        "topIntents": top,
        "keyPlaces": [],
    }


@router.get("/admin/kpis")
async def contract_admin_kpis() -> dict[str, Any]:
    return {
        "cards": [
            {"key": "search", "label": "검색 (스텁)", "value": "—"},
            {"key": "planner", "label": "플래너 (스텁)", "value": "—"},
        ]
    }


@router.get("/admin/ingestion")
async def contract_admin_ingestion() -> dict[str, Any]:
    return {
        "source": "TourAPI KorService2",
        "status": "live-bridge",
        "lastSuccessAt": None,
    }
