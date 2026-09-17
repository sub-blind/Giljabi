"""강원도 하루 여행 화면에서 사용하는 내부 API."""

from fastapi import APIRouter, Depends

from app.services.day_trip import (
    CourseRequest, CourseResponse, IntentRequest, IntentResponse, Place,
    SearchRequest, SearchResponse, StatusResponse, ErrorResponse, get_day_trip,
)
from app.services.travel_content import (
    AccessResponse, PhotoRequest, PhotoResponse, RegionsResponse, RelatedResponse, StoryResponse, get_travel_content,
)
from app.services.course_route import RouteResponse, get_course_route

router = APIRouter(prefix="/day-trip", tags=["강원도 하루 여행"], responses={
    422: {"description": "입력 조건 또는 장소 ID 검증 실패", "model": ErrorResponse},
    404: {"description": "장소 없음 또는 제공 지역 밖", "model": ErrorResponse},
    429: {"description": "요청량 또는 관광 조회량 제한", "model": ErrorResponse},
    502: {"description": "관광 정보 연결·응답 실패", "model": ErrorResponse},
    503: {"description": "관광 연결 준비 중", "model": ErrorResponse},
})


@router.get("/status", summary="관광·AI 연결 준비 상태", response_model=StatusResponse, response_description="연결 준비 상태")
async def get_status(service=Depends(get_day_trip)):
    settings = service.settings
    return {"tourismReady": bool(settings.tour_api_service_key.strip()),
            "aiReady": bool(settings.openai_api_key and settings.openai_model), "testing": service.testing,
            "photosReady": bool(settings.photo_api_service_key), "audioReady": bool(settings.audio_api_service_key),
            "relatedReady": bool(settings.related_api_service_key), "accessReady": bool(settings.access_api_service_key.strip()),
            "routeReady": bool(settings.kakao_rest_api_key.strip())}


@router.get("/regions", summary="강원도 시군 선택지", response_model=RegionsResponse, response_description="실제 지역코드 목록")
async def get_regions(service=Depends(get_day_trip)):
    return await service.regions()


@router.post("/photos/search", summary="강원도 관광사진 검색", response_model=PhotoResponse, response_description="촬영지를 확인한 사진")
async def search_photos(body: PhotoRequest, service=Depends(get_travel_content)):
    return await service.photos(body)


@router.get("/places/{place_id}/stories", summary="장소명·위치를 대조한 원본 이야기", response_model=StoryResponse, response_description="오디 원본 대본·오디오")
async def get_stories(place_id: str, service=Depends(get_travel_content)):
    return await service.stories(place_id)


@router.get("/places/{place_id}/related", summary="기준월 연관 관광지와 실제 장소 연결", response_model=RelatedResponse, response_description="지역·이름을 대조한 연관 후보")
async def get_related(place_id: str, service=Depends(get_travel_content)):
    return await service.related(place_id)


@router.get("/places/{place_id}/accessibility", summary="동일 장소를 대조한 방문 편의정보", response_model=AccessResponse, response_description="무장애 여행정보의 제공 항목")
async def get_accessibility(place_id: str, service=Depends(get_travel_content)):
    return await service.accessibility(place_id)


@router.post("/intent", summary="여행 문장 해석", response_model=IntentResponse, response_description="수정 가능한 여행 조건")
async def parse_intent(body: IntentRequest, service=Depends(get_day_trip)):
    return await service.intent(body.query)


@router.post("/places/search", summary="실제 강원도 장소 검색", response_model=SearchResponse, response_description="실제 후보와 적용 조건")
async def search_places(body: SearchRequest, service=Depends(get_day_trip)):
    return await service.search(body)


@router.get("/places/{place_id}", summary="실제 강원도 장소 상세 확인", response_model=Place, response_description="실제 장소 상세")
async def get_place(place_id: str, service=Depends(get_day_trip)):
    return await service.detail(place_id)


@router.post("/course", summary="선택한 장소 재검증과 코스 근거 확인", response_model=CourseResponse, response_description="재검증한 코스와 장소별 근거")
async def create_course(body: CourseRequest, service=Depends(get_day_trip)):
    return await service.course(body)


@router.post("/course/route", summary="재검증한 코스 구간의 자동차 경로·예상 이동", response_model=RouteResponse)
async def course_route(body: CourseRequest, service=Depends(get_course_route), day_trip=Depends(get_day_trip)):
    return await service.route(body, day_trip)
