"""무장애 자료를 실제 장소와 대조하고 누락·실패를 처리하는 모의 검증."""
import pytest

from app.tour_api.client import TourApiError
from tests.test_travel_content import ROW, client, envelope

ACCESS_ROW = {**ROW, "modifiedtime": "20250917103000"}


def provider(common, details, search=None, calls=None):
    async def extra(service, operation, params):
        assert service == "access"
        if calls is not None:
            calls.append((operation, params))
        if operation == "detailCommon2":
            return envelope(common)
        if operation == "detailWithTour2":
            return envelope(details)
        if operation == "areaCode2":
            return envelope([{"code": "32", "name": "강원특별자치도"}] if not params.get("areaCode") else [{"code": "99", "name": "춘천시"}])
        if operation == "searchKeyword2":
            assert params["areaCode"] == "32" and params["sigunguCode"] == "99"
            return envelope(search or [])
        raise AssertionError("예상하지 않은 기능")
    return extra


def test_accessibility_shows_only_provided_sanitized_fields_after_place_verification():
    details = [{"contentid": "2001", "exit": "<b>턱 없음</b><script>삭제</script>", "parking": "", "stroller": "   ",
                "lactationroom": "수유실 제공", "unknown": "표시하지 않음"}]
    with client(provider([ACCESS_ROW], details)) as api:
        result = api.get("/api/v1/day-trip/places/14_2001/accessibility").json()
        assert result["matched"] is True and result["sourceModifiedDate"] == "2025-09-17"
        assert {field["key"]: field["value"] for field in result["fields"]} == {"exit": "턱 없음", "lactationroom": "수유실 제공"}
        assert "정보가 없는 항목" in result["notices"][0]


@pytest.mark.parametrize("changes", [{"title": "다른 장소"}, {"addr1": "강원특별자치도 춘천시 다른 주소"},
                                    {"contenttypeid": "12"}, {"mapx": "128.8"}])
def test_same_identifier_does_not_link_different_name_address_type_or_distant_location(changes):
    with client(provider([{**ACCESS_ROW, **changes}], [{"contentid": "2001", "exit": "잘못된 안내"}])) as api:
        response = api.get("/api/v1/day-trip/places/14_2001/accessibility")
        assert response.status_code == 200
        assert response.json()["matched"] is False and response.json()["fields"] == []


def test_name_lookup_uses_own_region_codes_and_verified_identifier_from_other_service():
    calls = []
    with client(provider([], [{"contentid": "9001", "exit": "제공된 출입구 안내"}],
                         [{**ACCESS_ROW, "contentid": "9001"}], calls)) as api:
        result = api.get("/api/v1/day-trip/places/14_2001/accessibility").json()
        assert result["matched"] is True and result["fields"][0]["value"] == "제공된 출입구 안내"
        assert next(params for operation, params in calls if operation == "detailWithTour2")["contentId"] == "9001"


def test_multiple_verified_identifiers_remain_unlinked():
    candidates = [{**ACCESS_ROW, "contentid": str(identifier)} for identifier in [9001, 9002]]
    with client(provider([], [], candidates)) as api:
        result = api.get("/api/v1/day-trip/places/14_2001/accessibility").json()
        assert result["matched"] is False and result["fields"] == []


@pytest.mark.parametrize("details", [[], [{"contentid": "2001", "exit": " "}], [{"contentid": "9002", "exit": "다른 장소 정보"}]])
def test_verified_place_with_missing_fields_or_mismatched_detail_returns_no_claim(details):
    with client(provider([ACCESS_ROW], details)) as api:
        result = api.get("/api/v1/day-trip/places/14_2001/accessibility").json()
        assert result["matched"] is True and result["fields"] == []


def test_accessibility_failure_preserves_basic_place_detail_and_rejects_bad_id_before_external_call():
    async def failed(*args):
        raise TourApiError("무장애 정보를 불러오지 못했어요.", status_code=502)
    with client(failed) as api:
        assert api.get("/api/v1/day-trip/places/14_2001/accessibility").status_code == 502
        assert api.get("/api/v1/day-trip/places/14_2001").status_code == 200
        assert api.get("/api/v1/day-trip/places/photo_2001/accessibility").status_code == 422
