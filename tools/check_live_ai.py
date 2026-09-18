"""실제 AI 조건 해석을 확인한다. 실행 시 유료 외부 요청을 최대 10회 보낸다."""

import asyncio
import json
import re
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings
from app.services.day_trip import DayTripService, timestamp


CASES = [
    ("강원도에서 바다 보고 카페 가고 싶어", None, {"attraction", "food"}, False),
    ("춘천에서 박물관 보고 식사하는 하루 여행", "춘천시", {"culture", "food"}, False),
    ("평창 명소 하루 여행", "평창군", {"attraction"}, False),
    ("강릉에서 조용한 산책을 하고 싶어", "강릉시", {"attraction"}, True),
    ("박물관 구경", None, {"culture"}, False),
    ("서울에서 1박 2일 여행", None, {"attraction", "food"}, True),
    ("속초에서 휠체어와 반려동물 동반 가능한 카페", "속초시", {"food"}, True),
    ("원주에서 미술관 보고 점심 먹기", "원주시", {"culture", "food"}, False),
    ("태백 명소 중 주차 가능하고 지금 영업 중인 곳", "태백시", {"attraction"}, True),
    ("홍천에서 여유롭게 산책하기", "홍천군", {"attraction"}, False),
]


class RecordingAI:
    def __init__(self, client):
        self.client = client
        self.status = None
        self.error_code = None
        self.usage = {}

    async def post(self, *args, **kwargs):
        self.status, self.error_code, self.usage = None, None, {}
        response = await self.client.post(*args, **kwargs)
        self.status = response.status_code
        try:
            body = response.json()
            code = (body.get("error") or {}).get("code")
            if isinstance(code, str) and re.fullmatch(r"[a-z0-9_.-]{1,64}", code):
                self.error_code = code
            raw_usage = body.get("usage") or {}
            self.usage = {name: raw_usage[name] for name in ("input_tokens", "output_tokens")
                          if isinstance(raw_usage.get(name), int)}
        except (ValueError, AttributeError, TypeError):
            pass
        return response


async def main():
    settings = get_settings()
    if not settings.openai_api_key or not settings.openai_model:
        print("서버의 OPENAI_API_KEY와 OPENAI_MODEL을 먼저 설정해주세요.")
        return 1
    print(json.dumps({"실행시각": timestamp(), "모델": settings.openai_model,
                      "범위": "실제 조건 해석 10개 예시, 관광 조회·브라우저 검증은 별도"}, ensure_ascii=False), flush=True)
    passed = 0
    async with httpx.AsyncClient() as client:
        recorder = RecordingAI(client)
        service = DayTripService(settings, ai_client=recorder)
        for query, city, categories, unsupported in CASES:
            result = await service.intent(query)
            intent = result["intent"]
            checks = {"AI 응답": result["mode"] == "ai", "지역": intent["city"] == city,
                      "유형": set(intent["categories"]) == categories,
                      "미지원 안내": bool(intent["unsupportedConditions"]) == unsupported,
                      "검색어": not any(re.search("휠체어|반려|주차|영업", word) for word in intent["keywords"])}
            if "조용" in query or "여유" in query:
                checks["선호"] = bool(intent["preferences"])
            success = all(checks.values())
            passed += success
            print(json.dumps({"입력": query, "통과": success, "검사": checks, "응답": result,
                              "외부상태": recorder.status, "오류코드": recorder.error_code,
                              "토큰": recorder.usage}, ensure_ascii=False), flush=True)
            if recorder.status in {401, 403, 429}:
                print("인증·권한·사용량 문제로 추가 유료 요청을 중단합니다.", flush=True)
                break
    print(f"예시 평가: {passed}/{len(CASES)} 통과. 일반적인 정확도나 전체 모델 성공률을 의미하지 않습니다.")
    return 0 if passed == len(CASES) else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(asyncio.run(main()))
