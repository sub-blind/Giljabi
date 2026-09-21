"""외부 인증키 없이 여행 흐름과 잘못된 AI 응답을 검증한다."""

import asyncio
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.services.day_trip import DayTripService, fallback, get_day_trip
from app.tour_api import KorServiceOp
from app.tour_api.client import TourApiError

OVERVIEW = "기능 검증용 가상 장소입니다. 실제 관광지를 나타내지 않으며 소개 원문의 근거 대조를 확인하는 데이터입니다."
ROWS = [{"contentid": str(i), "contenttypeid": kind, "title": name, "addr1": "강원특별자치도 강릉시 테스트 주소",
         "areacode": "54", "sigungucode": "1", "overview": OVERVIEW, "mapy": "37.75", "mapx": "128.88"}
        for i, kind, name in [(1001, "12", "테스트 해변"), (1002, "39", "테스트 카페"), (1003, "14", "테스트 문화시설")]]
INTENT = {"region": "gangwon", "city": "강릉시", "durationDays": 1, "categories": ["attraction", "food"], "keywords": ["해변"],
          "preferences": [], "unsupportedConditions": []}


def envelope(items):
    return {"response": {"body": {"items": {"item": items}, "totalCount": len(items)}}}


async def provider(operation, *, extra_params):
    if operation == KorServiceOp.AREA_CODE_LIST:
        return envelope([{"code": "1", "name": "강릉시"}, {"code": "2", "name": "춘천시"}] if extra_params.get("areaCode") else [{"code": "54", "name": "강원특별자치도"}])
    if operation == KorServiceOp.DETAIL_COMMON:
        return envelope([row for row in ROWS if row["contentid"] == extra_params["contentId"]])
    if operation == KorServiceOp.DETAIL_INTRO:
        return envelope([])
    assert extra_params["areaCode"] == "54" and extra_params["sigunguCode"] == "1"
    return envelope(ROWS)


def client(service):
    app = create_app()
    app.dependency_overrides[get_day_trip] = lambda: service
    return TestClient(app)


def offline_settings(**overrides):
    # 로컬 .env와 셸의 실제 AI 인증 설정을 단위 테스트로 가져오지 않는다.
    values = {"openai_api_key": "", "openai_model": "", **overrides}
    return Settings(_env_file=None, **values)


def test_manual_intent_and_real_adapter_contract():
    with client(DayTripService(offline_settings(), provider, testing=True)) as api:
        assert api.get("/api/v1/day-trip/status").json()["testing"] is True
        result = api.post("/api/v1/day-trip/intent", json={"query": "바다 보고 식사하기"}).json()
        assert result["mode"] == "manual" and result["intent"]["durationDays"] == 1
        search = api.post("/api/v1/day-trip/places/search", json={"intent": INTENT}).json()
        assert {row["id"] for row in search["places"]} == {"12_1001", "39_1002"}
        assert search["appliedIntent"] == INTENT
        assert search["places"][0]["source"] == "tourapi"


@pytest.mark.parametrize("ids", [[], ["12_1001"] * 2, ["stub_0"], ["12_1001"] * 4])
def test_invalid_course_ids_are_rejected_before_provider_call(ids):
    async def forbidden(*args, **kwargs):
        raise AssertionError("검증 실패 입력은 외부 API를 호출하면 안 됩니다.")
    with client(DayTripService(offline_settings(), forbidden)) as api:
        response = api.post("/api/v1/day-trip/course", json={"placeIds": ids, "intent": INTENT})
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "INVALID_INPUT"


@pytest.mark.parametrize("ids", [["12_1001"], ["39_1002", "12_1001"]])
def test_short_course_revalidates_and_preserves_order_without_ai(ids):
    with client(DayTripService(offline_settings(), provider)) as api:
        response = api.post("/api/v1/day-trip/course", json={"placeIds": ids, "intent": INTENT})
        assert response.status_code == 200
        course = response.json()
        assert [row["id"] for row in course["orderedPlaces"]] == ids
        assert all(item["mode"] == "facts" for item in course["explanations"])
        assert "이동시간" not in json.dumps(course, ensure_ascii=False)


def test_region_type_and_missing_places_are_rejected():
    async def outside(operation, *, extra_params):
        if operation == KorServiceOp.DETAIL_COMMON:
            return envelope([{**ROWS[0], "addr1": "서울특별시", "areacode": "1"}])
        return await provider(operation, extra_params=extra_params)
    with client(DayTripService(offline_settings(), outside)) as api:
        assert api.get("/api/v1/day-trip/places/12_1001").status_code == 404
    with client(DayTripService(offline_settings(), provider)) as api:
        assert api.get("/api/v1/day-trip/places/39_1001").status_code == 404
        assert api.get("/api/v1/day-trip/places/12_9999").status_code == 404


def test_malformed_fields_are_not_rendered_as_facts():
    async def malformed(operation, *, extra_params):
        if operation == KorServiceOp.DETAIL_COMMON:
            return envelope([{**ROWS[0], "mapy": "NaN", "mapx": "Infinity", "firstimage": "javascript:alert(1)",
                              "overview": "<script>alert(1)</script><b>제공된 소개</b>"}])
        return await provider(operation, extra_params=extra_params)
    with client(DayTripService(offline_settings(), malformed)) as api:
        place = api.get("/api/v1/day-trip/places/12_1001").json()
        assert place["latitude"] is None and place["longitude"] is None and place["imageUrl"] is None
        assert place["overview"] == "제공된 소개"


def test_place_detail_includes_only_sanitized_visit_information():
    async def with_visit_info(operation, *, extra_params):
        if operation == KorServiceOp.AREA_CODE_LIST:
            return await provider(operation, extra_params=extra_params)
        if operation == KorServiceOp.DETAIL_COMMON:
            return envelope([{**ROWS[1], "tel": "033-123-4567<script>삭제</script>"}])
        if operation == KorServiceOp.DETAIL_INTRO:
            assert extra_params["contentTypeId"] == "39"
            return envelope([{"infocenterfood": "033-123-4567", "opentimefood": "<b>10:00~20:00</b>",
                              "restdatefood": "매주 월요일", "parkingfood": "주차 가능",
                              "firstmenu": "감자옹심이", "treatmenu": ""}])
        return await provider(operation, extra_params=extra_params)

    with client(DayTripService(offline_settings(), with_visit_info)) as api:
        response = api.get("/api/v1/day-trip/places/39_1002")
        assert response.status_code == 200
        info = {item["label"]: item["value"] for item in response.json()["visitInfo"]}
        assert info == {"전화": "033-123-4567", "영업시간": "10:00~20:00",
                        "휴무일": "매주 월요일", "주차": "주차 가능", "대표메뉴": "감자옹심이"}
        assert "<" not in json.dumps(info, ensure_ascii=False)


@pytest.mark.parametrize("bad", [False, True])
def test_batched_ai_evidence_is_called_once_and_checked_against_source(bad):
    calls = []
    def ai_handler(request):
        calls.append(request)
        body = json.loads(request.content)
        assert body["store"] is False and body["text"]["format"]["strict"] is True
        quote = "언제나 조용하고 오전 9시에 문을 엽니다." if bad else OVERVIEW[:40]
        output = {"items": [{"placeId": "12_1001", "quote": quote}, {"placeId": "39_1002", "quote": quote}]}
        return httpx.Response(200, json={"status": "completed", "output": [{"type": "message", "content": [
            {"type": "output_text", "text": json.dumps(output, ensure_ascii=False)}]}]})
    ai_client = httpx.AsyncClient(transport=httpx.MockTransport(ai_handler))
    service = DayTripService(offline_settings(openai_api_key="test-only-key", openai_model="test-model"), provider, ai_client)
    with client(service) as api:
        result = api.post("/api/v1/day-trip/course", json={"placeIds": ["12_1001", "39_1002"], "intent": INTENT}).json()
        assert len(calls) == 1
        assert all(item["mode"] == ("facts" if bad else "ai") for item in result["explanations"])
        assert "오전 9시" not in json.dumps(result, ensure_ascii=False)
    asyncio.run(ai_client.aclose())


def test_course_without_preferences_does_not_wait_for_ai_evidence():
    def unexpected_ai_call(_request):
        raise AssertionError("선호 조건이 없는 지도 코스에서 AI를 호출하면 안 됩니다.")

    ai_client = httpx.AsyncClient(transport=httpx.MockTransport(unexpected_ai_call))
    service = DayTripService(offline_settings(openai_api_key="test-only-key", openai_model="test-model"), provider, ai_client)
    intent = {**INTENT, "keywords": [], "preferences": []}
    with client(service) as api:
        result = api.post("/api/v1/day-trip/course", json={"placeIds": ["12_1001", "39_1002"], "intent": intent}).json()
        assert all(item["mode"] == "facts" for item in result["explanations"])
    asyncio.run(ai_client.aclose())


def test_provider_failure_and_unsupported_input_are_korean():
    async def failed(*args, **kwargs):
        raise TourApiError("관광 정보를 불러오지 못했어요.", status_code=502)
    with client(DayTripService(offline_settings(), failed)) as api:
        response = api.post("/api/v1/day-trip/places/search", json={"intent": INTENT})
        assert response.status_code == 502 and "관광 정보" in response.json()["error"]["message"]
        assert api.post("/api/v1/day-trip/intent", json={"query": ""}).status_code == 422
        assert api.post("/api/v1/day-trip/places/search", json={"intent": {**INTENT, "region": "seoul"}}).status_code == 422


def test_manual_museum_is_not_mistaken_for_overnight_trip():
    assert not fallback("강릉 박물관 구경").unsupportedConditions
    assert fallback("강릉 1박 2일 여행").unsupportedConditions
    assert fallback("조용하고 여유로운 산책").preferences == ["조용한 분위기", "여유로운 여행"]


def test_amenities_are_excluded_from_trip_candidates():
    async def amenities(operation, *, extra_params):
        if operation in {KorServiceOp.AREA_BASED_LIST, KorServiceOp.SEARCH_KEYWORD}:
            return envelope([{**ROWS[0], "title": "테스트 해변 화장실"}])
        return await provider(operation, extra_params=extra_params)
    with client(DayTripService(offline_settings(), amenities)) as api:
        response = api.post("/api/v1/day-trip/places/search", json={"intent": INTENT})
        assert response.json()["places"] == []


@pytest.mark.parametrize("response", [
    httpx.Response(429, json={"error": {"code": "insufficient_quota"}}),
    httpx.Response(200, json={"status": "completed", "output": [{"type": "message", "content": [
        {"type": "refusal", "refusal": "응답 거절"}]}]}),
    httpx.Response(200, json={"status": "completed", "output": [{"type": "message", "content": [
        {"type": "output_text", "text": json.dumps({"city": "서울시", "categories": ["culture"],
         "keywords": [], "preferences": [], "unsupportedConditions": []})}]}]}),
])
def test_unusable_ai_intent_keeps_manual_conditions(response):
    ai = httpx.AsyncClient(transport=httpx.MockTransport(lambda request: response))
    service = DayTripService(offline_settings(openai_api_key="test-only-key", openai_model="test-model"), provider, ai)
    with client(service) as api:
        result = api.post("/api/v1/day-trip/intent", json={"query": "춘천 박물관과 식사"}).json()
        assert result["mode"] == "manual"
        assert result["intent"]["city"] == "춘천시"
        assert set(result["intent"]["categories"]) == {"culture", "food"}
        assert result["notices"]
    asyncio.run(ai.aclose())


def test_local_ai_environment_is_excluded_from_unit_settings(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-environment-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-environment-model")
    settings = offline_settings()
    assert not settings.openai_api_key and not settings.openai_model
