"""관광사진·오디·연관 관광지를 실제 장소와 대조해 화면에 제공한다."""

import asyncio
import hashlib
import json
import re
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

from pydantic import Field, field_validator

from app.services.day_trip import (
    CITY_NAMES, Intent, Place, StrictModel, clean, coordinate, distance_km, get_day_trip, rows, timestamp,
)
from app.tour_api import KorServiceOp
from app.tour_api.client import TourApiError, get_service_json


class RegionsResponse(StrictModel):
    region: str
    name: str
    cities: list[dict[str, str]]


class PhotoRequest(StrictModel):
    city: str | None = None
    keyword: str = Field(default="", max_length=40)
    page: int = Field(default=1, ge=1, le=5)

    @field_validator("city")
    @classmethod
    def valid_city(cls, value):
        return Intent.valid_city(value)


class TravelPhoto(StrictModel):
    id: str
    title: str
    location: str
    city: str | None
    imageUrl: str
    photographer: str
    keywords: list[str]
    source: str


class PhotoResponse(StrictModel):
    photos: list[TravelPhoto]
    page: int
    hasMore: bool
    appliedCity: str | None
    appliedKeyword: str
    notices: list[str]
    retrievedAt: str


class TravelStory(StrictModel):
    id: str
    title: str
    script: str
    audioUrl: str | None
    matchMethod: str
    source: str


class StoryResponse(StrictModel):
    placeId: str
    stories: list[TravelStory]
    notices: list[str]
    retrievedAt: str


class RelatedCandidate(StrictModel):
    id: str
    name: str
    city: str
    category: str
    rank: int | None
    place: Place | None


class RelatedResponse(StrictModel):
    placeId: str
    candidates: list[RelatedCandidate]
    baseMonth: str
    notices: list[str]
    retrievedAt: str


class AccessField(StrictModel):
    key: str
    label: str
    group: str
    value: str


class AccessResponse(StrictModel):
    placeId: str
    matched: bool
    fields: list[AccessField]
    source: Literal["with-tour"] = "with-tour"
    sourceModifiedDate: str | None
    notices: list[str]
    retrievedAt: str


# 확인한 detailWithTour2 응답 항목만 노출한다. 빈 값은 불가로 해석하지 않는다.
ACCESS_FIELDS = {
    "이동·시설": {"parking": "장애인 주차", "publictransport": "대중교통", "route": "접근로", "ticketoffice": "매표소",
               "promotion": "홍보물", "wheelchair": "휠체어 대여", "exit": "출입구", "elevator": "엘리베이터",
               "restroom": "장애인 화장실", "auditorium": "관람석", "room": "객실", "handicapetc": "기타 이동 편의"},
    "시각·청각 안내": {"braileblock": "점자블록", "helpdog": "보조견 동반", "guidehuman": "안내 인력", "audioguide": "오디오 안내",
                   "bigprint": "큰 글자 안내", "brailepromotion": "점자 홍보물", "guidesystem": "유도 안내",
                   "blindhandicapetc": "기타 시각 편의", "signguide": "수어 안내", "videoguide": "영상 안내",
                   "hearingroom": "청각 편의 객실", "hearinghandicapetc": "기타 청각 편의"},
    "영유아 동반": {"stroller": "유모차 대여", "lactationroom": "수유실", "babysparechair": "유아용 의자", "infantsfamilyetc": "기타 영유아 편의"},
}


def normalized(value):
    return re.sub(r"[\W_]+", "", clean(value).lower())


def place_name(value):
    return re.sub(r"\([^)]*\)", "", clean(value).split("/")[0]).strip()


def resource_url(value, audio=False):
    value = str(value or "").replace("http://", "https://", 1)
    try:
        url = urlparse(value)
        hosts = {"sfj608538-sfj608538.ktcdn.co.kr"} if audio else {"tong.visitkorea.or.kr"}
        if url.scheme == "https" and url.hostname in hosts and url.port in {None, 443} and not url.username and not url.query:
            return value
    except ValueError:
        pass
    return None


class TravelContentService:
    def __init__(self, trip, provider=None):
        self.trip = trip
        self.settings = trip.settings
        self.provider = provider
        path = Path(__file__).resolve().parents[1] / "tour_api" / "related_region_codes.json"
        self.related_codes = json.loads(path.read_text(encoding="utf-8"))
        self._access_codes = None
        self._access_lock = asyncio.Lock()

    async def call(self, service, operation, **params):
        if self.provider:
            return rows(await self.provider(service, operation, params))
        key = getattr(self.settings, service + "_api_service_key")
        base = getattr(self.settings, service + "_api_base_url")
        return rows(await get_service_json(base, key, operation, extra_params={
            "pageNo": 1, "numOfRows": 24, **params}))

    async def photos(self, query: PhotoRequest):
        keyword = query.keyword or (query.city[:-1] if query.city else "강원")
        items, total = await self.call("photo", "gallerySearchList1", keyword=keyword, pageNo=query.page, arrange="A")
        photos = {}
        for row in items:
            location = clean(row.get("galPhotographyLocation"), 200)
            image = resource_url(row.get("galWebImageUrl"))
            city = next((name for name in CITY_NAMES if name in location), None)
            content_id = str(row.get("galContentId", ""))
            if not re.match(r"^강원(?:특별자치도|도)?\s", location) or not image or not re.fullmatch(r"\d{1,20}", content_id):
                continue
            if query.city and city != query.city:
                continue
            photos[content_id] = {"id": "photo_" + content_id, "title": clean(row.get("galTitle"), 120) or "강원도 여행 사진",
                "location": location, "city": city, "imageUrl": image,
                "photographer": clean(row.get("galPhotographer"), 60) or "한국관광공사",
                "keywords": [clean(word, 30) for word in re.split(r"[,，]", clean(row.get("galSearchKeyword"), 300)) if word.strip()][:6],
                "source": "photo-gallery"}
        return {"photos": list(photos.values())[:12], "page": query.page,
                "hasMore": query.page < 5 and total > query.page * 24, "appliedCity": query.city,
                "appliedKeyword": keyword, "notices": ["촬영지 정보에서 강원도를 확인한 사진이에요. 사진 위치와 관광 장소는 검색 후 따로 확인해요."],
                "retrievedAt": timestamp()}

    async def stories(self, place_id):
        place = await self.trip.detail(place_id)
        keyword = place_name(place["name"])
        items, _ = await self.call("audio", "storySearchList", keyword=keyword[:100], langCode="ko")
        stories = {}
        target = normalized(keyword)
        for row in items:
            if len(target) < 3 or target not in normalized(row.get("title")) or row.get("langCode") != "ko":
                continue
            position = {"latitude": coordinate(row.get("mapY"), 33, 39), "longitude": coordinate(row.get("mapX"), 124, 132)}
            distance = distance_km(place, position)
            if distance is not None and distance > 2:
                continue
            text = clean(row.get("script"), 12000)
            audio = resource_url(row.get("audioUrl"), audio=True)
            if not text and not audio:
                continue
            identifier = "odii_" + hashlib.sha256((str(row.get("stid")) + str(row.get("stlid")) + str(row.get("audioTitle"))).encode()).hexdigest()[:16]
            stories[identifier] = {"id": identifier, "title": clean(row.get("audioTitle"), 180) or "이 장소의 이야기",
                "script": text, "audioUrl": audio, "matchMethod": "place_name_and_location" if distance is not None else "place_name",
                "source": "odii"}
        notices = ["관광지명과 제공된 위치를 대조한 한국관광공사 오디의 원본 이야기예요. AI가 만든 이야기가 아니에요."] if stories else [
            "검색 결과는 있지만 관광지명·언어·제공 위치 또는 이야기 내용을 대조해 이 장소의 자료로 확인하지 못했어요." if items else
            "현재 관광지명으로 조회된 한국어 오디 자료가 없어요. 모든 관광지에 오디 이야기가 등록되어 있지는 않고, 서비스마다 이름이 다를 수도 있어요."]
        return {"placeId": place_id, "stories": list(stories.values())[:4],
                "notices": notices,
                "retrievedAt": timestamp()}

    async def access_codes(self):
        # 국문 서비스의 코드를 재사용하지 않고 무장애 서비스의 목록을 확인한다.
        async with self._access_lock:
            if self._access_codes is None:
                provinces, _ = await self.call("access", "areaCode2", numOfRows=100)
                province = next((str(row["code"]) for row in provinces if "강원" in str(row.get("name", "")) and row.get("code")), None)
                if not province:
                    raise TourApiError("무장애 서비스의 강원 지역코드를 확인하지 못했어요.", status_code=502)
                cities, _ = await self.call("access", "areaCode2", areaCode=province, numOfRows=100)
                self._access_codes = province, {row["name"]: str(row["code"]) for row in cities if row.get("name") in CITY_NAMES and row.get("code")}
            return self._access_codes

    @staticmethod
    def access_match(row, place):
        identifier = str(row.get("contentid", ""))
        if not re.fullmatch(r"\d{1,15}", identifier) or str(row.get("contenttypeid")) != place["id"].split("_")[0]:
            return False
        if normalized(row.get("title")) != normalized(place["name"]) or normalized(row.get("addr1")) != normalized(place["address"]):
            return False
        position = {"latitude": coordinate(row.get("mapy"), 33, 39), "longitude": coordinate(row.get("mapx"), 124, 132)}
        distance = distance_km(place, position)
        return distance is None or distance <= 0.2

    async def accessibility(self, place_id):
        place = await self.trip.detail(place_id)
        content_id = place_id.split("_")[1]
        # 동일한 ID라고 가정하지 않고 후보로 조회해 이름·주소·제공 좌표를 대조한다.
        common, _ = await self.call("access", "detailCommon2", contentId=content_id)
        matches = {str(row["contentid"]): row for row in common if str(row.get("contentid")) == content_id and self.access_match(row, place)}
        if not matches:
            province, cities = await self.access_codes()
            city = cities.get(place["city"])
            if not city:
                raise TourApiError("무장애 서비스의 시군 코드를 확인하지 못했어요.", status_code=502)
            items, _ = await self.call("access", "searchKeyword2", keyword=place_name(place["name"])[:100],
                                      areaCode=province, sigunguCode=city, numOfRows=24)
            matches = {str(row["contentid"]): row for row in items if self.access_match(row, place)}
        verified = next(iter(matches.values())) if len(matches) == 1 else None
        fields, modified = [], None
        if verified:
            matched_id = str(verified["contentid"])
            details, _ = await self.call("access", "detailWithTour2", contentId=matched_id)
            detail = next((row for row in details if str(row.get("contentid")) == matched_id), {})
            fields = [{"key": key, "label": label, "group": group, "value": clean(detail.get(key), 1200)}
                      for group, labels in ACCESS_FIELDS.items() for key, label in labels.items() if clean(detail.get(key), 1200)]
            try:
                modified = datetime.strptime(str(verified.get("modifiedtime", "")), "%Y%m%d%H%M%S").strftime("%Y-%m-%d")
            except ValueError:
                pass
        notices = ["한국관광공사 무장애 여행정보에서 제공한 항목이에요. 정보가 없는 항목은 이용 가능 또는 불가로 판단하지 않아요.",
                   "방문 시점의 시설 운영 상태는 달라질 수 있어요. 필요한 편의시설은 방문 전에 운영기관에 확인해주세요."]
        if not verified:
            notices.append("무장애 서비스에서 이름·주소가 일치하는 단일 장소를 확인하지 못했어요. 미등록·이름 차이·동명 장소 등이 원인일 수 있어요.")
        elif not fields:
            notices.append("같은 장소는 확인했지만 현재 제공된 방문 편의 항목이 없어요.")
        return {"placeId": place_id, "matched": verified is not None, "fields": fields, "source": "with-tour",
                "sourceModifiedDate": modified, "notices": notices, "retrievedAt": timestamp()}

    async def resolve_related(self, row, codes):
        target_city = clean(row.get("rlteSignguNm"), 20)
        name = place_name(row.get("rlteTatsNm"))
        if target_city not in CITY_NAMES or "숙박" in str(row.get("rlteCtgryLclsNm", "")):
            return None
        intent = Intent(city=target_city, categories=["attraction", "culture", "food"], keywords=[], preferences=[], unsupportedConditions=[])
        try:
            items, _ = await self.trip.call(KorServiceOp.SEARCH_KEYWORD, **self.trip.scope_params(intent, codes),
                                          keyword=name[:100], numOfRows=12)
            # 서비스마다 띄어쓰기가 달라 전체 이름 검색이 비기도 한다.
            # 짧은 검색어로 후보만 넓히며 채택 조건은 여전히 전체 이름 일치다.
            fragment = normalized(name)[-4:]
            if not items and len(normalized(name)) > 4:
                items, _ = await self.trip.call(KorServiceOp.SEARCH_KEYWORD, **self.trip.scope_params(intent, codes),
                                               keyword=fragment, numOfRows=12)
        except TourApiError:
            return None
        matches = {}
        for item in items:
            place = self.trip.place(item, intent, codes)
            if place and normalized(place_name(place["name"])) == normalized(name):
                matches[place["id"]] = place
        return next(iter(matches.values())) if len(matches) == 1 else None

    async def related(self, place_id):
        place = await self.trip.detail(place_id)
        month = self.settings.related_api_base_month
        if not re.fullmatch(r"\d{4}(0[1-9]|1[0-2])", month):
            raise TourApiError("연관 관광지의 기준월 설정을 확인해주세요.", status_code=503)
        code = self.related_codes["cities"].get(place["city"])
        if not code:
            raise TourApiError("이 지역의 연관 관광 코드를 확인하지 못했어요.", status_code=503)
        items, _ = await self.call("related", "searchKeyword1", keyword=place_name(place["name"])[:100],
                                   baseYm=month, areaCd=self.related_codes["areaCd"], signguCd=code, numOfRows=30)
        target = normalized(place_name(place["name"]))
        filtered = []
        seen = set()
        for row in items:
            if str(row.get("baseYm")) != month or str(row.get("areaCd")) != "51" or str(row.get("signguCd")) != code:
                continue
            if normalized(place_name(row.get("tAtsNm"))) != target:
                continue
            if str(row.get("rlteRegnCd")) != "51" or row.get("rlteSignguNm") not in CITY_NAMES:
                continue
            name = clean(row.get("rlteTatsNm"), 160)
            if not name or name in seen or normalized(place_name(name)) == target:
                continue
            seen.add(name)
            filtered.append(row)
        def rank(row):
            value = str(row.get("rlteRank", ""))
            return int(value) if value.isdigit() else 999
        filtered = sorted(filtered, key=rank)[:5]
        codes = await self.trip.region_codes()
        resolved = await asyncio.gather(*(self.resolve_related(row, codes) for row in filtered))
        candidates = []
        for index, row in enumerate(filtered):
            candidates.append({"id": "related_" + hashlib.sha256(str(row.get("rlteTatsNm")).encode()).hexdigest()[:16],
                "name": clean(row.get("rlteTatsNm"), 160), "city": clean(row.get("rlteSignguNm"), 20),
                "category": clean(row.get("rlteCtgryLclsNm"), 40), "rank": rank(row) if rank(row) != 999 else None,
                "place": resolved[index] if index < len(resolved) else None})
        notices = ["티맵 내비게이션 차량 이동 자료의 연결성 정보예요. 기준월의 참고 자료이며 현재 인기나 최단 이동 경로를 뜻하지 않아요.",
                   "국문 관광정보에서 이름·지역을 확인한 장소만 여행 후보로 연결해요."]
        if not candidates:
            notices.append("검색 결과는 있지만 기준월·중심 관광지명·강원도 지역과 일치하는 연관 자료를 확인하지 못했어요. 이름이 비슷한 다른 장소의 자료는 표시하지 않아요." if items else
                           "현재 기준월과 관광지명으로 조회된 연관 자료가 없어요. 서비스마다 수록된 장소와 이름이 달라 연결되지 않을 수도 있어요.")
        return {"placeId": place_id, "candidates": candidates, "baseMonth": month,
            "notices": notices, "retrievedAt": timestamp()}


@lru_cache
def get_travel_content():
    return TravelContentService(get_day_trip())
