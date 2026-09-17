"""자동차 경로의 장소 재검증·부분 실패·단위·비밀 값 처리를 모의 검증한다."""

import copy

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.services.course_route import CourseRouteService, get_course_route
from app.services.day_trip import DayTripService, get_day_trip
from app.tour_api import KorServiceOp

IDS = ["12_1001", "39_1002", "12_1003"]
INTENT = {"region": "gangwon", "city": "강릉시", "durationDays": 1, "categories": ["attraction", "food"],
          "keywords": [], "preferences": [], "unsupportedConditions": []}
GOOD = {"routes": [{"result_code": 0, "summary": {"distance": 12000, "duration": 1800},
                   "sections": [{"roads": [{"vertexes": [128.88, 37.75, 128.89, 37.76]}]}]}]}


def client(handler, *, missing=False, outside=False, limit=100, key="test-key"):
    settings = Settings(_env_file=None, kakao_rest_api_key=key, route_api_daily_limit=limit)
    async def provider(operation, *, extra_params):
        if operation == KorServiceOp.AREA_CODE_LIST:
            items = [{"code": "1", "name": "강릉시"}] if extra_params.get("areaCode") else [{"code": "32", "name": "강원특별자치도"}]
        else:
            found = next((place_id for place_id in IDS if place_id.split("_")[1] == extra_params["contentId"]), None)
            items = [{"contentid": found.split("_")[1], "contenttypeid": found.split("_")[0], "title": "기능 검증용 장소 " + found,
                      "addr1": "서울특별시" if outside else "강원특별자치도 강릉시 테스트 주소", "areacode": "1" if outside else "32",
                      "sigungucode": "1", "mapy": "" if missing and found == IDS[2] else "37.75", "mapx": str(128.87 + IDS.index(found) * .01)}] if found else []
        return {"response": {"body": {"items": {"item": items}, "totalCount": len(items)}}}
    app = create_app()
    app.dependency_overrides[get_day_trip] = lambda: DayTripService(settings, provider)
    service = CourseRouteService(settings, transport=httpx.MockTransport(handler))
    app.dependency_overrides[get_course_route] = lambda: service
    return TestClient(app)


def request(api, ids=IDS[:2], **extra):
    return api.post("/api/v1/day-trip/course/route", json={"placeIds": ids, "intent": INTENT, **extra})


def test_valid_route_units_coordinates_order_and_cache():
    calls = []
    def handler(req):
        calls.append(req)
        assert req.headers["Authorization"] == "KakaoAK test-key"
        assert req.url.params["summary"] == "false"
        return httpx.Response(200, json=GOOD)
    with client(handler) as api:
        route = request(api).json()
        assert route["orderedPlaceIds"] == IDS[:2]
        assert route["mode"] == "car" and route["totalDistanceMeters"] == 12000 and route["totalDurationSeconds"] == 1800
        assert route["segments"][0]["path"] == [[37.75, 128.88], [37.76, 128.89]]
        assert request(api).json()["segments"][0]["retrievedAt"] == route["segments"][0]["retrievedAt"]
        assert len(calls) == 1
        assert request(api, list(reversed(IDS[:2]))).status_code == 200 and len(calls) == 2
        assert calls[0].url.params["origin"].startswith("128.")


@pytest.mark.parametrize("ids,extra", [([], {}), ([IDS[0]] * 2, {}), (["photo_1001"], {}), (IDS + ["12_1004"], {}), (IDS[:2], {"coordinates": [127, 37]})])
def test_invalid_client_input_never_calls_route_provider(ids, extra):
    def forbidden(req):
        raise AssertionError("잘못된 입력은 경로 API를 호출하면 안 됩니다.")
    with client(forbidden) as api:
        assert request(api, ids, **extra).status_code == 422


def test_non_gangwon_place_is_rejected_before_route_lookup():
    def forbidden(req):
        raise AssertionError("지역 밖 장소는 경로 API를 호출하면 안 됩니다.")
    with client(forbidden, outside=True) as api:
        assert request(api).status_code == 404


def test_missing_coordinates_preserve_ready_segment_without_false_total():
    calls = []
    def handler(req):
        calls.append(req)
        return httpx.Response(200, json=GOOD)
    with client(handler, missing=True) as api:
        route = request(api, IDS).json()
        assert len(calls) == 1
        assert [item["status"] for item in route["segments"]] == ["ready", "missing-coordinates"]
        assert route["totalDistanceMeters"] is None and route["totalDurationSeconds"] is None


def test_auth_failure_is_safe_and_keeps_the_other_segment():
    count = 0
    def handler(req):
        nonlocal count
        count += 1
        return httpx.Response(200, json=GOOD) if count == 1 else httpx.Response(401, json={"message": "test-key secret"})
    with client(handler) as api:
        response = request(api, IDS)
        assert response.status_code == 200 and "test-key" not in response.text and "secret" not in response.text
        assert response.json()["totalDurationSeconds"] is None
        assert response.json()["segments"][0]["status"] == "ready"


@pytest.mark.parametrize("change", ["negative-duration", "wrong-unit-type", "no-route", "odd-path", "bad-coordinate", "result-error"])
def test_malformed_external_response_is_not_rendered_as_route(change):
    data = copy.deepcopy(GOOD)
    route = data["routes"][0]
    if change == "negative-duration": route["summary"]["duration"] = -1
    if change == "wrong-unit-type": route["summary"]["distance"] = "12000"
    if change == "no-route": data["routes"] = []
    if change == "odd-path": route["sections"][0]["roads"][0]["vertexes"] = [128, 37, 128]
    if change == "bad-coordinate": route["sections"][0]["roads"][0]["vertexes"] = [128, float("inf")]
    if change == "result-error": route["result_code"] = 104
    # 무한값도 HTTP 본문에서 파싱되는 비정상 JSON 값으로 시험한다.
    import json
    with client(lambda req: httpx.Response(200, content=json.dumps(data))) as api:
        segment = request(api).json()["segments"][0]
        assert segment["status"] == "unavailable" and segment["path"] == [] and segment["durationSeconds"] is None


def test_timeout_daily_limit_and_one_place_fallback():
    count = 0
    def handler(req):
        nonlocal count
        count += 1
        raise httpx.ReadTimeout("test-key secret", request=req)
    with client(handler, limit=1) as api:
        assert request(api).json()["segments"][0]["status"] == "unavailable"
        assert request(api, IDS[1:]).json()["segments"][0]["status"] == "unavailable" and count == 1
        one = request(api, IDS[:1]).json()
        assert one["segments"] == [] and one["totalDurationSeconds"] == 0 and count == 1
