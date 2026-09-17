"""강원도 범위와 관광 서비스 간 장소 연결을 모의 응답으로 검증한다."""
import asyncio
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.services.day_trip import DayTripService, SearchRequest, fallback, get_day_trip
from app.services.travel_content import PhotoRequest, TravelContentService, get_travel_content
from app.tour_api import KorServiceOp
from app.tour_api.client import TourApiError

ROW = {"contentid": "2001", "contenttypeid": "14", "title": "테스트춘천박물관", "addr1": "강원특별자치도 춘천시 테스트 주소",
       "areacode": "54", "sigungucode": "2", "mapx": "127.73", "mapy": "37.88", "overview": "검증용 가상 박물관 소개입니다."}
OTHER = {**ROW, "contentid": "2002", "contenttypeid": "12", "title": "테스트춘천정원"}
INTENT = {"region": "gangwon", "city": None, "durationDays": 1, "categories": ["culture", "attraction"],
          "keywords": [], "preferences": [], "unsupportedConditions": []}

def envelope(items):
    return {"response": {"body": {"items": {"item": items}, "totalCount": len(items)}}}

async def national(operation, *, extra_params):
    if operation == KorServiceOp.AREA_CODE_LIST:
        return envelope([{"code": "1", "name": "강릉시"}, {"code": "2", "name": "춘천시"}] if extra_params.get("areaCode") else [{"code": "54", "name": "강원특별자치도"}])
    if operation == KorServiceOp.DETAIL_COMMON:
        return envelope([row for row in [ROW, OTHER] if row["contentid"] == extra_params["contentId"]])
    return envelope([ROW, OTHER])

def client(extra, provider=national):
    trip = DayTripService(Settings(_env_file=None), provider, testing=True)
    content = TravelContentService(trip, extra)
    app = create_app()
    app.dependency_overrides[get_day_trip] = lambda: trip
    app.dependency_overrides[get_travel_content] = lambda: content
    return TestClient(app)

def test_province_search_omits_city_code_and_city_search_filters_actual_address():
    requests = []
    async def record(operation, *, extra_params):
        if operation != KorServiceOp.AREA_CODE_LIST:
            requests.append(extra_params)
        return await national(operation, extra_params=extra_params)
    service = DayTripService(Settings(_env_file=None), record)
    result = asyncio.run(service.search(SearchRequest.model_validate({"intent": INTENT})))
    assert len(result["places"]) == 2 and all("sigunguCode" not in params for params in requests)
    requests.clear()
    result = asyncio.run(service.search(SearchRequest.model_validate({"intent": {**INTENT, "city": "강릉"}})))
    assert result["places"] == [] and all(params["sigunguCode"] == "1" for params in requests)
    assert fallback("춘천 박물관 하루 여행").city == "춘천시"

def test_invalid_city_and_photo_page_rejected_before_external_call():
    async def forbidden(*args, **kwargs):
        raise AssertionError("잘못된 입력은 외부 조회를 하지 않는다")
    with client(forbidden, forbidden) as api:
        assert api.post("/api/v1/day-trip/places/search", json={"intent": {**INTENT, "city": "서울시"}}).status_code == 422
        assert api.post("/api/v1/day-trip/photos/search", json={"page": 6}).status_code == 422

def test_photos_require_gangwon_metadata_and_safe_media_without_place_id_join():
    photo = {"galContentId": "7788", "galTitle": "가상 사진", "galPhotographyLocation": "강원특별자치도 춘천시",
             "galWebImageUrl": "http://tong.visitkorea.or.kr/test.jpg", "galPhotographer": "테스트"}
    async def extra(service, operation, params):
        assert service == "photo" and operation == "gallerySearchList1" and params["keyword"] == "춘천"
        return envelope([photo, {**photo, "galContentId": "7789", "galPhotographyLocation": "서울특별시"},
                         {**photo, "galContentId": "7790", "galWebImageUrl": "https://untrusted.example/test.jpg"}])
    with client(extra) as api:
        result = api.post("/api/v1/day-trip/photos/search", json={"city": "춘천시"}).json()
        assert len(result["photos"]) == 1
        assert result["photos"][0]["id"] == "photo_7788"
        assert result["photos"][0]["imageUrl"].startswith("https://tong.visitkorea.or.kr/")
        assert "latitude" not in result["photos"][0] and "placeId" not in result["photos"][0]
        assert api.get("/api/v1/day-trip/places/photo_7788").status_code == 422

def test_stories_match_name_language_and_nearby_position_and_sanitize_script():
    story = {"stid": "9", "stlid": "10", "title": ROW["title"], "audioTitle": "가상 이야기", "langCode": "ko",
             "mapX": "127.73", "mapY": "37.88", "script": "<script>삭제</script><b>테스트 원문</b>",
             "audioUrl": "http://sfj608538-sfj608538.ktcdn.co.kr/file/audio/test.mp3"}
    async def extra(service, operation, params):
        assert service == "audio" and params["keyword"] == ROW["title"] and params["langCode"] == "ko"
        return envelope([story, {**story, "stid": "11", "mapX": "128.8"}, {**story, "stid": "12", "langCode": "en"},
                         {**story, "stid": "13", "title": "다른 장소"}])
    with client(extra) as api:
        result = api.get("/api/v1/day-trip/places/14_2001/stories").json()
        assert len(result["stories"]) == 1 and result["stories"][0]["script"] == "테스트 원문"
        assert result["stories"][0]["matchMethod"] == "place_name_and_location"
        assert result["stories"][0]["audioUrl"].startswith("https://")

def related_row(**changes):
    return {"baseYm": "202504", "areaCd": "51", "signguCd": "51110", "tAtsNm": ROW["title"] + "/본관",
            "rlteTatsNm": OTHER["title"], "rlteRegnCd": "51", "rlteSignguNm": "춘천시",
            "rlteRank": "1", "rlteCtgryLclsNm": "관광지", **changes}

@pytest.mark.parametrize("kind", ["stories", "related"])
@pytest.mark.parametrize("has_rows", [False, True])
def test_empty_content_distinguishes_no_search_results_from_unmatched_results(kind, has_rows):
    async def extra(service, operation, params):
        row = {"title": "다른 장소", "langCode": "ko", "script": "다른 장소 이야기"} if kind == "stories" else related_row(tAtsNm="다른 중심 관광지")
        return envelope([row] if has_rows else [])
    with client(extra) as api:
        response = api.get("/api/v1/day-trip/places/14_2001/" + kind)
        assert response.status_code == 200
        result = response.json()
        assert result["stories" if kind == "stories" else "candidates"] == []
        message = " ".join(result["notices"])
        assert ("검색 결과는 있지만" if has_rows else "조회된") in message
        assert api.get("/api/v1/day-trip/places/14_2001").status_code == 200

def test_related_uses_distinct_official_codes_period_and_unique_actual_place():
    async def extra(service, operation, params):
        assert service == "related" and operation == "searchKeyword1"
        assert params["areaCd"] == "51" and params["signguCd"] == "51110" and params["baseYm"] == "202504"
        return envelope([related_row(), related_row(baseYm="202505"), related_row(tAtsNm="다른 중심 관광지"),
                         related_row(rlteRegnCd="11")])
    async def record(operation, *, extra_params):
        if operation == KorServiceOp.SEARCH_KEYWORD:
            assert extra_params["areaCode"] == "54" and extra_params["sigunguCode"] == "2"
        return await national(operation, extra_params=extra_params)
    with client(extra, record) as api:
        result = api.get("/api/v1/day-trip/places/14_2001/related").json()
        assert len(result["candidates"]) == 1 and result["baseMonth"] == "202504"
        assert result["candidates"][0]["place"]["id"] == "12_2002"
        assert "현재 인기" in result["notices"][0]

def test_ambiguous_related_names_remain_unlinked():
    async def extra(*args):
        return envelope([related_row()])
    async def ambiguous(operation, *, extra_params):
        if operation == KorServiceOp.SEARCH_KEYWORD:
            return envelope([OTHER, {**OTHER, "contentid": "2003"}])
        return await national(operation, extra_params=extra_params)
    with client(extra, ambiguous) as api:
        result = api.get("/api/v1/day-trip/places/14_2001/related").json()
        assert result["candidates"][0]["place"] is None

def test_related_spacing_fallback_still_requires_full_normalized_name():
    async def extra(*args):
        return envelope([related_row()])
    async def spaced(operation, *, extra_params):
        if operation == KorServiceOp.SEARCH_KEYWORD:
            if extra_params["keyword"] == OTHER["title"]:
                return envelope([])
            return envelope([{**OTHER, "title": "테스트 춘천 정원"}, {**OTHER, "contentid": "2004", "title": "다른춘천정원"}])
        return await national(operation, extra_params=extra_params)
    with client(extra, spaced) as api:
        result = api.get("/api/v1/day-trip/places/14_2001/related").json()
        assert result["candidates"][0]["place"]["id"] == "12_2002"

def test_extra_failure_does_not_break_basic_place_detail():
    async def failed(*args):
        raise TourApiError("추가 관광 정보를 불러오지 못했어요.", status_code=502)
    with client(failed) as api:
        assert api.get("/api/v1/day-trip/places/14_2001/stories").status_code == 502
        assert api.get("/api/v1/day-trip/places/14_2001").status_code == 200

def test_far_apart_stops_warn_with_straight_distance_only():
    async def far(operation, *, extra_params):
        result = await national(operation, extra_params=extra_params)
        if operation == KorServiceOp.DETAIL_COMMON and extra_params["contentId"] == "2002":
            return envelope([{**OTHER, "mapx": "128.8"}])
        return result
    with client(lambda *args: None, far) as api:
        result = api.post("/api/v1/day-trip/course", json={"intent": INTENT, "placeIds": ["14_2001", "12_2002"]}).json()
        assert "직선거리" in result["notices"][0] and "이동시간" not in json.dumps(result, ensure_ascii=False)

@pytest.mark.parametrize("city", [None, "춘천시", "서울시"])
def test_ai_city_nullable_schema_and_server_city_validation(city):
    def handler(request):
        body = json.loads(request.content)
        assert "city" in body["text"]["format"]["schema"]["required"]
        output = {"city": city, "categories": ["culture"], "keywords": [], "preferences": [], "unsupportedConditions": []}
        return httpx.Response(200, json={"status": "completed", "output": [{"type": "message", "content": [
            {"type": "output_text", "text": json.dumps(output)}]}]})
    ai = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    trip = DayTripService(Settings(_env_file=None, openai_api_key="test", openai_model="test"), national, ai)
    result = asyncio.run(trip.intent("춘천 박물관"))
    assert result["mode"] == ("manual" if city == "서울시" else "ai")
    assert result["intent"]["city"] == ("춘천시" if city == "서울시" else city)
    asyncio.run(ai.aclose())
