"""관광 원천에서 확인한 코스 장소 사이의 자동차 이동을 조회한다."""

import asyncio
import math
import time
from datetime import datetime, timezone
from functools import lru_cache
from typing import Literal

import httpx
from pydantic import Field

from app.config import get_settings
from app.services.day_trip import CourseRequest, StrictModel, timestamp
from app.tour_api.client import TourApiError


class RouteSegment(StrictModel):
    originId: str
    destinationId: str
    status: Literal["ready", "unavailable", "missing-coordinates"]
    distanceMeters: int | None = Field(default=None, ge=0, le=1500000)
    durationSeconds: int | None = Field(default=None, ge=0, le=172800)
    path: list[tuple[float, float]] = Field(default_factory=list, max_length=20000)
    notice: str | None = None
    retrievedAt: str


class RouteResponse(StrictModel):
    orderedPlaceIds: list[str]
    mode: Literal["car"] = "car"
    source: Literal["kakaomobility"] = "kakaomobility"
    segments: list[RouteSegment]
    totalDistanceMeters: int | None
    totalDurationSeconds: int | None
    notices: list[str]
    retrievedAt: str


class CourseRouteService:
    def __init__(self, settings, *, transport=None):
        self.settings = settings
        self.transport = transport
        self.semaphore = asyncio.Semaphore(2)
        self.cache = {}
        self.day = ""
        self.calls = 0

    async def segment(self, origin, destination):
        base = {"originId": origin["id"], "destinationId": destination["id"], "retrievedAt": timestamp()}
        if any(place[key] is None for place in [origin, destination] for key in ["latitude", "longitude"]):
            return RouteSegment(**base, status="missing-coordinates", notice="좌표가 없는 장소가 있어 이 구간의 자동차 이동을 계산하지 못했어요.")
        if not self.settings.kakao_rest_api_key.strip():
            return RouteSegment(**base, status="unavailable", notice="자동차 길찾기 연결을 준비 중이에요. 외부 지도에서 확인해주세요.")
        coords = tuple(place[key] for place in [origin, destination] for key in ["longitude", "latitude"])
        async with self.semaphore:
            now = time.monotonic()
            self.cache = {key: value for key, value in self.cache.items() if now - value[0] < 120}
            if coords in self.cache:
                data = self.cache[coords][1]
                return data.model_copy(update={"originId": origin["id"], "destinationId": destination["id"]})
            day = datetime.now(timezone.utc).date().isoformat()
            if day != self.day:
                self.day, self.calls = day, 0
            if self.calls >= self.settings.route_api_daily_limit:
                return RouteSegment(**base, status="unavailable", notice="오늘의 자동차 이동 조회 한도에 도달했어요. 외부 길찾기를 이용해주세요.")
            self.calls += 1
            try:
                async with httpx.AsyncClient(transport=self.transport, timeout=10, follow_redirects=False) as client:
                    response = await client.get("https://apis-navi.kakaomobility.com/v1/directions",
                        headers={"Authorization": "KakaoAK " + self.settings.kakao_rest_api_key},
                        params={"origin": f"{coords[0]},{coords[1]}", "destination": f"{coords[2]},{coords[3]}",
                                "summary": "false", "priority": "RECOMMEND", "alternatives": "false", "road_details": "false"})
                    response.raise_for_status()
                    raw = response.json()["routes"][0]
                    if type(raw["result_code"]) is not int or raw["result_code"] != 0:
                        raise ValueError
                    summary = raw["summary"]
                    distance, duration = summary["distance"], summary["duration"]
                    if type(distance) is not int or type(duration) is not int:
                        raise ValueError
                    path = []
                    for section in raw.get("sections", []):
                        for road in section.get("roads", []):
                            vertices = road["vertexes"]
                            if not isinstance(vertices, list) or len(vertices) % 2:
                                raise ValueError
                            for i in range(0, len(vertices), 2):
                                lon, lat = vertices[i:i + 2]
                                if any(type(value) not in [int, float] or not math.isfinite(value) for value in [lon, lat]) or not (124 <= lon <= 132 and 33 <= lat <= 40):
                                    raise ValueError
                                point = (lat, lon)
                                if not path or point != path[-1]:
                                    path.append(point)
                                if len(path) > 20000:
                                    raise ValueError
                    data = RouteSegment(**base, status="ready", distanceMeters=distance, durationSeconds=duration, path=path)
                    self.cache[coords] = (time.monotonic(), data)
                    return data
            except (httpx.HTTPError, ValueError, TypeError, KeyError, IndexError, AttributeError):
                # 외부 오류 메시지·인증 헤더·원본 응답을 사용자나 로그로 보내지 않는다.
                return RouteSegment(**base, status="unavailable", notice="이 구간의 자동차 경로를 확인하지 못했어요. 카카오맵에서 다시 확인해주세요.")

    async def route(self, query: CourseRequest, day_trip):
        places = await asyncio.gather(*(day_trip.detail(place_id, query.intent) for place_id in query.placeIds))
        if any(place["category"] not in query.intent.categories for place in places):
            raise TourApiError("선택한 장소 유형과 여행 조건을 확인해주세요.", status_code=422)
        segments = await asyncio.gather(*(self.segment(first, second) for first, second in zip(places, places[1:])))
        complete = all(segment.status == "ready" for segment in segments)
        notices = ["자동차 기준 조회 시점의 예상 이동이에요. 첫 장소까지의 이동·체류·주차 시간은 포함하지 않아요."]
        if len(places) == 1:
            notices.append("한 장소 코스에는 장소 사이의 이동 구간이 없어요.")
        if not complete:
            notices.append("확인하지 못한 구간이 있어 전체 이동 합계는 표시하지 않아요.")
        return RouteResponse(orderedPlaceIds=query.placeIds, segments=segments,
            totalDistanceMeters=sum(segment.distanceMeters for segment in segments) if complete else None,
            totalDurationSeconds=sum(segment.durationSeconds for segment in segments) if complete else None,
            notices=notices, retrievedAt=timestamp())


@lru_cache
def get_course_route():
    return CourseRouteService(get_settings())
