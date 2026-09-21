"""사진·오디오·연관·무장애 API의 최소 연결 확인. 인증키·인증 URL은 출력하지 않는다."""

import asyncio
import json
import logging
import sys
from pathlib import Path
from urllib.parse import unquote

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx

from app.config import get_settings

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)


async def check(label, base, expected_base, key, operation, params, fields):
    if not key.strip():
        return {"서비스": label, "성공": False, "안내": "서버 인증 설정이 없습니다."}
    if base.rstrip("/") != expected_base:
        return {"서비스": label, "성공": False, "안내": "공식 서버 주소를 확인해주세요."}
    common = {"serviceKey": unquote(key.strip()), "MobileOS": "ETC", "MobileApp": "StoryRoute",
              "_type": "json", "pageNo": 1, "numOfRows": 3}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(base.rstrip("/") + "/" + operation, params={**common, **params})
        result = {"서비스": label, "HTTP": response.status_code, "성공": False}
        payload = response.json()
        if not isinstance(payload, dict):
            raise ValueError
        envelope = payload.get("response") or payload
        header = envelope.get("header") or {}
        code = str(header.get("resultCode", ""))
        result["정상결과코드"] = code in {"0000", "00", "0"}
        if response.status_code != 200 or not result["정상결과코드"]:
            result["안내"] = "정상 데이터를 확인하지 못했습니다. 인증·서비스 상태와 조회 조건을 확인해주세요."
            return result
        body = envelope.get("body") or {}
        items = (body.get("items") or {}).get("item") or []
        items = [items] if isinstance(items, dict) else items
        if not isinstance(items, list) or any(not isinstance(item, dict) for item in items):
            raise ValueError
        result.update({"성공": True, "전체건수": body.get("totalCount"), "확인건수": len(items),
                       "예시": [{field: item.get(field) for field in fields} for item in items[:3]]})
        if label == "오디오 가이드":
            result["대본있음"] = any(bool(item.get("script")) for item in items)
            result["음성URL있음"] = any(bool(item.get("audioUrl")) for item in items)
        return result
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        return {"서비스": label, "성공": False, "안내": "연결 또는 응답 형식을 확인하지 못했습니다."}


async def main():
    settings = get_settings()
    results = await asyncio.gather(
        check("관광사진", settings.photo_api_base_url,
              "https://apis.data.go.kr/B551011/PhotoGalleryService1", settings.photo_api_service_key,
              "gallerySearchList1", {"keyword": "강원", "arrange": "A"},
              ["galTitle", "galPhotographyLocation"]),
        check("오디오 가이드", settings.audio_api_base_url,
              "https://apis.data.go.kr/B551011/Odii", settings.audio_api_service_key,
              "storySearchList", {"keyword": "춘천", "langCode": "ko"},
              ["title", "audioTitle", "playTime"]),
        check("연관 관광지", settings.related_api_base_url,
              "https://apis.data.go.kr/B551011/TarRlteTarService1", settings.related_api_service_key,
              # 공식 가이드의 지원 기간과 시군구 코드표에 따른 춘천 예시.
              "areaBasedList1", {"baseYm": "202504", "areaCd": "51", "signguCd": "51110"},
              ["baseYm", "areaNm", "signguNm", "tAtsNm", "rlteTatsNm", "rlteRank"]),
        check("무장애 여행정보", settings.access_api_base_url,
              "https://apis.data.go.kr/B551011/KorWithService2", settings.access_api_service_key,
              "searchKeyword2", {"keyword": "가원습지"}, ["title", "addr1", "contentid"]),
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0 if all(result["성공"] for result in results) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
