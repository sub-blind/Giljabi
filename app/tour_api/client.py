from typing import Any

import httpx

from app.config import get_settings
from app.tour_api.operations import KorServiceOp


class TourApiError(Exception):
    def __init__(self, message: str, *, status_code: int | None = None, body: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.body = body


def _base_url() -> str:
    settings = get_settings()
    base = settings.tour_api_kor_service_base.rstrip("/") + "/"
    return base


def _common_params() -> dict[str, str]:
    s = get_settings()
    return {
        "serviceKey": s.tour_api_service_key,
        "MobileApp": s.tour_api_mobile_app,
        "MobileOS": s.tour_api_mobile_os,
        "_type": "json",
    }


async def get_json(
    operation: KorServiceOp,
    *,
    extra_params: dict[str, Any] | None = None,
    timeout: float = 30.0,
) -> dict[str, Any] | list[Any]:
    """
    KorService2 단일 GET — 공통 파라미터(키, MobileApp/OS, _type) 자동 병합.
    extra_params: pageNo, numOfRows, areaCode 등 오퍼레이션별 필드.
    """
    settings = get_settings()
    if not settings.tour_api_service_key.strip():
        raise TourApiError("TOUR_API_SERVICE_KEY is not set", status_code=503)

    url = _base_url() + operation.value
    params: dict[str, Any] = {**_common_params(), **(extra_params or {})}

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            r = await client.get(url, params=params)
        except httpx.RequestError as e:
            raise TourApiError(f"TourAPI request failed: {e!s}", status_code=502) from e

    if r.status_code != 200:
        raise TourApiError(
            f"TourAPI HTTP {r.status_code}",
            status_code=502,
            body=r.text[:800],
        )

    try:
        data = r.json()
    except ValueError:
        return {"_parse_error": True, "raw": r.text}

    return data
