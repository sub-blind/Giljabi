"""
KorService2(국문) 오퍼레이션 이름 — 실제 파라미터는 명세서(Swagger)와 맞출 것.
https://apis.data.go.kr/ 기준 경로: /B551011/KorService2/{오퍼레이션}
(구 KorService1 / *1 계열과 병행 운영 — 문서에 맞게 베이스 URL·이름만 통일하면 됨.)
"""

from enum import StrEnum


class KorServiceOp(StrEnum):
    # --- 공통·코드 ---
    AREA_CODE_LIST = "areaCode2"
    CATEGORY_CODE_LIST = "categoryCode2"

    # --- 목록·검색 ---
    AREA_BASED_LIST = "areaBasedList2"
    LOCATION_BASED_LIST = "locationBasedList2"
    SEARCH_KEYWORD = "searchKeyword2"
    SEARCH_FESTIVAL = "searchFestival2"
    SEARCH_STAY = "searchStay2"

    # --- 상세 ---
    DETAIL_COMMON = "detailCommon2"
    DETAIL_INTRO = "detailIntro2"
    DETAIL_INFO = "detailInfo2"
    DETAIL_IMAGE = "detailImage2"

    # --- 기타 (필요 시 명세에서 추가) ---
    # 반려동물, 동기화 목록 등은 오퍼레이션명 확인 후 같은 Enum에 추가


# Enum 값 → 한글 설명 (Swagger/문서와 대응)
_LABELS: dict[str, str] = {
    KorServiceOp.AREA_CODE_LIST: "지역코드·시군구 목록",
    KorServiceOp.CATEGORY_CODE_LIST: "서비스·대분류·중분류·소분류 코드",
    KorServiceOp.AREA_BASED_LIST: "지역기반 관광정보 목록",
    KorServiceOp.LOCATION_BASED_LIST: "위치기반 관광정보 목록",
    KorServiceOp.SEARCH_KEYWORD: "키워드 검색",
    KorServiceOp.SEARCH_FESTIVAL: "행사 검색",
    KorServiceOp.SEARCH_STAY: "숙박 검색",
    KorServiceOp.DETAIL_COMMON: "공통정보 조회",
    KorServiceOp.DETAIL_INTRO: "소개정보 조회",
    KorServiceOp.DETAIL_INFO: "반복정보 조회",
    KorServiceOp.DETAIL_IMAGE: "이미지 조회",
}


def operation_label(op: KorServiceOp) -> str:
    return _LABELS.get(op, op.value)
