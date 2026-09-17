import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Any
from urllib.parse import unquote

import httpx

from app.config import get_settings
from app.tour_api.operations import KorServiceOp

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
_semaphore = asyncio.Semaphore(3)
_day = ""
_calls: dict[str, int] = {}


class TourApiError(Exception):
    def __init__(self, message: str, *, status_code: int | None = None, body: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.body = body


def _base_url() -> str:
    settings = get_settings()
    base = settings.tour_api_kor_service_base.rstrip("/") + "/"
    base = base.replace("http://apis.data.go.kr/", "https://apis.data.go.kr/", 1)
    return base


def _common_params() -> dict[str, str]:
    s = get_settings()
    return {
        "serviceKey": unquote(s.tour_api_service_key.strip()),
        "MobileApp": s.tour_api_mobile_app,
        "MobileOS": s.tour_api_mobile_os,
        "_type": "json",
    }


async def get_json(
    operation: KorServiceOp,
    *,
    extra_params: dict[str, Any] | None = None,
    timeout: float = 10.0,
) -> dict[str, Any] | list[Any]:
    """
    KorService2 단일 GET — 공통 파라미터(키, MobileApp/OS, _type) 자동 병합.
    extra_params: pageNo, numOfRows, areaCode 등 오퍼레이션별 필드.
    """
    return await _fetch_json(_base_url(), operation.value, _common_params(), extra_params, timeout)


async def get_service_json(base_url, service_key, operation, *, extra_params=None, timeout=10.0):
    """사진·오디·연관·무장애 API. 키를 검증한 공식 호스트에만 전달한다."""
    allowed = {"https://apis.data.go.kr/B551011/PhotoGalleryService1",
               "https://apis.data.go.kr/B551011/Odii",
               "https://apis.data.go.kr/B551011/TarRlteTarService1",
               "https://apis.data.go.kr/B551011/KorWithService2"}
    if base_url.rstrip("/") not in allowed:
        raise TourApiError("관광 서비스의 서버 주소를 확인해주세요.", status_code=503)
    return await _fetch_json(base_url.rstrip("/") + "/", operation,
        {"serviceKey": unquote(service_key.strip()), "MobileApp": get_settings().tour_api_mobile_app,
         "MobileOS": "ETC", "_type": "json"}, extra_params, timeout)


async def _fetch_json(base, operation, common, extra, timeout):
    global _day
    settings = get_settings()
    if not common["serviceKey"]:
        raise TourApiError("관광 데이터 연결을 준비 중이에요. 직접 여행 조건을 선택할 수 있어요.", status_code=503)

    today = datetime.now(timezone(timedelta(hours=9))).date().isoformat()
    if _day != today:
        _day = today
        _calls.clear()
    if _calls.get(base, 0) >= settings.tour_api_daily_limit:
        raise TourApiError("오늘 관광 정보 조회량을 모두 사용했어요.", status_code=429)
    _calls[base] = _calls.get(base, 0) + 1

    url = base + operation
    params: dict[str, Any] = {**common, **(extra or {})}

    async with _semaphore, httpx.AsyncClient(timeout=timeout) as client:
        try:
            r = await client.get(url, params=params)
        except httpx.RequestError:
            raise TourApiError("관광 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.", status_code=502) from None

    if r.status_code != 200:
        raise TourApiError(
            "관광 정보 연결에 실패했어요. 잠시 후 다시 시도해주세요.",
            status_code=502,
        )

    try:
        data = r.json()
    except ValueError:
        raise TourApiError("관광 정보 연결 또는 인증 상태를 확인 중이에요.", status_code=502) from None

    if isinstance(data, dict):
        envelope = data.get("response") or data
        if not isinstance(envelope, dict) or not isinstance(envelope.get("header") or {}, dict):
            raise TourApiError("관광 정보 응답 형식을 확인할 수 없어요.", status_code=502)
        code = str((envelope.get("header") or {}).get("resultCode", ""))
        if code == "03":
            return {"response": {"body": {"items": {"item": []}, "totalCount": 0}}}
        if code not in {"0000", "00", "0"}:
            raise TourApiError("관광 정보 조회가 제한됐어요. 연결 상태를 확인해주세요.",
                               status_code=429 if code in {"22", "23"} else 502)

    return data
