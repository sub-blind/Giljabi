"""실제 관광 API의 최소 연결을 확인한다. 인증키나 인증 URL은 출력하지 않는다."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.day_trip import SearchRequest, fallback, get_day_trip
from app.tour_api.client import TourApiError


async def main():
    service = get_day_trip()
    if not service.settings.tour_api_service_key.strip():
        print("관광 API 인증키가 없어 실제 연결을 확인하지 않았습니다.")
        return 1
    try:
        result = await service.search(SearchRequest(intent=fallback("")))
        print("실제 관광 검색 성공: 후보 " + str(len(result["places"])) + "개")
        if result["places"]:
            place = await service.detail(result["places"][0]["id"])
            print("실제 장소 상세 성공: 강원도 주소·시군 검증=" + str(place["address"].startswith("강원") and bool(place["city"])))
        return 0
    except TourApiError as error:
        print("실제 관광 연결 확인 실패: " + str(error))
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
