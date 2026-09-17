# 프런트·API 구현 설계

2026년 9월 17일 · Tourism 저장소의 실제 구조 기준

현재 구현은 강원특별자치도 전체 검색과 18개 시군 선택, 관광사진 탐색·오디 이야기·기준월 연관 자료를 지원한다. 데이터 판단은 [강원도 API 선정안](API_SELECTION_GANGWON.md)을 따른다.

## 1. 기본 구성

프런트는 기존 Next.js 15·React 19·TypeScript 구조를 사용한다. 화면 스타일은 CSS Modules로 구성한다. 서버는 기존 FastAPI와 관광 API 어댑터를 활용한다. 프런트의 내부 `/api/v1/day-trip` 요청을 Next.js의 경로 연결로 백엔드에 전달한다.

## 2. 파일 배치

| 파일·폴더 | 역할 |
|---|---|
| `web/app/page.tsx` | 서비스 시작 화면 |
| `web/app/home/page.tsx` | 같은 여행 화면을 제공하는 기존 주소 |
| `web/components/storyroute/StoryRoute.tsx` | 세 단계 화면·공통 상태·선택·교체·순서 변경 |
| `web/components/storyroute/IntentEditor.tsx` | AI가 해석한 조건 또는 수동 조건 편집 |
| `web/components/storyroute/PlaceCard.tsx` | 실제 후보와 사진 누락 처리 |
| `web/components/storyroute/PlaceDetailPanel.tsx` | 실제 상세 조회·닫기·초점 복귀 |
| `web/components/storyroute/PhotoExplorer.tsx` | 사진 검색·조회 조건 유지·지역 검색 연결 |
| `web/components/storyroute/PlaceContent.tsx` | 오디 원본·오디오·연관 관광지 영역 |
| `web/components/storyroute/CourseMap.tsx` | 좌표 마커·지도 오류·크기 변경 처리 |
| `web/components/storyroute/StoryRoute.module.css` | 모바일·태블릿·PC 배치 |
| `web/lib/api.ts` | 요청·시간 제한·오류 정리 |
| `web/lib/storyroute/types.ts` | 화면과 서버의 공통 필드 |
| `web/lib/storyroute/storage.ts` | 브라우저 저장·복원 입력 검사 |
| `app/services/day_trip.py` | 관광 검색·장소 검증·AI 근거 확인 |
| `app/services/travel_content.py` | 별도 관광 서비스의 응답·매칭·안전한 공개 미디어 주소 |
| `app/api/v1/endpoints/day_trip.py` | 현재 화면의 API |

## 3. 공통 상태

| 상태 | 관리 값 | 갱신 시점 |
|---|---|---|
| phase | create / discover / course | 단계 전환·복원 |
| query | 여행 입력문 | 텍스트 입력 |
| intent | 편집 중인 지역·기간·관심 유형·키워드·선호·미지원 조건 | 해석·사용자 수정 |
| appliedIntent | 현재 검색 결과에 실제 적용한 조건 | 검색 성공 |
| places | 현재 조회한 실제 후보 | 검색 성공·추가 조회 |
| selectedIds | 순서 있는 최대 세 장소 ID | 선택·삭제·교체·순서 변경 |
| course | 재검증한 장소·AI 또는 사실 근거 | 코스 생성 성공 |
| page / hasMore | 후보 추가 조회 정보 | 검색 성공 |
| busy | 대기·해석·검색·코스 확인·복원 | 요청 시작·종료 |

상위 컴포넌트의 `useReducer`로 여행 상태를 관리한다. 편집 중인 조건과 결과에 적용한 조건을 분리한다. 새 검색이 성공하면 이전 선택을 초기화하고 알린다. 실패하면 이전 결과와 적용 조건을 유지한다.

요청 잠금과 요청 식별자로 중복 실행과 오래된 응답의 화면 반영을 막는다. 여행 요청·사진 탐색·상세와 추가 콘텐츠는 `AbortController`로 닫힌 화면의 요청 반영을 취소한다. 사진은 편집 필터와 실제 적용한 필터를 분리하며 새 조회 실패 시 이전 결과를 유지한다. TypeScript 타입과 별개로 서버가 실제 요청을 검증한다.

## 4. 세 화면

### 여행 입력

문장·예시 선택과 직접 조건 선택을 제공한다. 해석 실행 버튼을 눌렀을 때만 LLM을 호출한다. 사용자는 관심 유형·키워드를 고친 뒤 검색한다. 희망 분위기와 확인할 수 없는 조건은 사실 조건과 구분해서 표시한다. 강원도·당일이라는 제공 범위를 알리고 전체 또는 시군을 선택하게 한다. 지역 선택지는 서버가 조회한 실제 국문 관광정보 코드 목록을 사용한다.

### 장소 선택

실제 사진·이름·분류·주소·근거와 상세 조회를 제공한다. 사진이 없으면 누락 안내를 표시한다. 최대 세 장소를 고르고 특정 장소를 다른 후보로 바꿀 수 있다. 대체 후보가 없으면 추가 조회 또는 조건 변경을 안내한다. 후보 표시나 선택을 위해 LLM을 호출하지 않는다.

명소 유형에 섞인 화장실·주차장·관광안내소는 이름 기준으로 여행 후보에서 제외한다. 이 필터는 편의시설 후보를 줄이는 규칙이며 모든 장소의 목적 적합성을 보장하는 학습 모델은 아니다.

### 코스 확인

서버에서 다시 확인한 실제 장소, 소개 원문과 대조한 AI 단서 또는 확인된 사실, 위·아래 순서 변경, 좌표 마커, 외부 길찾기와 브라우저 저장을 제공한다. 순서 변경에는 LLM을 호출하지 않는다. 설명은 장소별로 유지한다.

## 5. 반응형 배치

| 폭 | 배치 |
|---|---|
| 320~767px | 카드 한 열, 선택 목록을 먼저 표시, 코스 목록 다음 지도, 상세 바텀시트 |
| 768~1023px | 카드 두 열, 선택 목록 별도 행, 코스 목록 다음 지도 |
| 1024px 이상 | 후보 목록과 선택 목록을 나란히 배치, 코스 목록과 지도도 나란히 배치 |

전체 콘텐츠는 약 1200px 안에 배치하고 모바일에서는 좌우 여백을 줄인다. 기존 430px 고정 앱 틀을 제거한다. Grid의 열에는 `minmax(0, 1fr)`을 사용하고 긴 이름·주소는 줄바꿈한다. 행동 버튼은 최소 44px 높이를 기준으로 한다.

지도 좌표 누락·배경 오류가 있어도 장소 목록과 저장은 유지한다. 잘못된 좌표를 임의의 서울 좌표로 대체하지 않는다. 실제 도로 경로·이동 분 수를 제공하는 것으로 표현하지 않는다.

## 6. 실제 API 계약

| 요청 | 역할 | 응답 |
|---|---|---|
| GET /api/v1/day-trip/status | 설정 준비 여부 확인 | tourismReady, aiReady, photosReady, audioReady, relatedReady, accessReady, testing |
| GET /api/v1/day-trip/regions | 실제 강원도 시군 목록 | region, name, cities |
| POST /api/v1/day-trip/photos/search | 촬영지를 확인한 사진 조회 | photos, appliedCity, appliedKeyword, page, hasMore, notices, retrievedAt |
| POST /api/v1/day-trip/intent | 여행 문장 해석 | intent, mode, notices |
| POST /api/v1/day-trip/places/search | 최종 조건으로 실제 검색 | places, appliedIntent, page, hasMore, notices, retrievedAt |
| GET /api/v1/day-trip/places/{place_id} | 실제 상세 확인 | Place |
| POST /api/v1/day-trip/course | 순서 있는 ID 재검증과 근거 | orderedPlaces, explanations, notices, retrievedAt |
| GET /api/v1/day-trip/places/{place_id}/stories | 이름·위치를 대조한 오디 | placeId, stories, notices, retrievedAt |
| GET /api/v1/day-trip/places/{place_id}/related | 기준월 연관 자료·실제 장소 연결 | placeId, candidates, baseMonth, notices, retrievedAt |
| GET /api/v1/day-trip/places/{place_id}/accessibility | 동일 장소를 확인한 방문 편의정보 | placeId, matched, fields, source, sourceModifiedDate, notices, retrievedAt |

이 계약은 외부 TourAPI의 원형 필드가 아니다. 내부 타입은 `web/lib/storyroute/types.ts`, 서버 모델은 `app/services/day_trip.py`에 있다. [실제 서버에서 추출한 계약](../contracts/day-trip.openapi.json)과 함께 관리한다.

### 여행 조건

```json
{
  "region": "gangwon",
  "city": null,
  "durationDays": 1,
  "categories": ["attraction", "food"],
  "keywords": ["해변"],
  "preferences": [],
  "unsupportedConditions": []
}
```

관심 유형은 attraction·culture·food만 허용한다. 키워드는 최대 세 개, 각각 30자 이내다. 주관적 선호와 미지원 조건은 각각 최대 세 개, 항목당 160자 이내다. `city`는 null이면 강원도 전체이며 강원도의 시군 이름만 허용한다. 예를 들어 춘천은 춘천시로 정규화한다. 서버는 잘못된 지역·기간·시군을 외부 호출 전에 거절한다. 시군을 지정하지 않으면 국문 조회에 `sigunguCode`를 보내지 않는다.

장소는 id·name·category·city·address·imageUrl·latitude·longitude·overview·evidence·source·retrievedAt을 포함한다. 사진과 좌표는 null일 수 있다. ID는 기존 저장소와 같은 `{contentTypeId}_{contentId}` 형식이다. 예시 ID는 실제 조회 결과를 의미하지 않는다.

### 최종 코스 검증

요청은 `placeIds`와 `intent`만 보낸다. 장소 ID는 중복 없이 1~3개다. 서버는 실제 관광 상세를 조회해 ID·지역·유형을 검사한다. 브라우저가 보낸 장소 설명을 신뢰해 AI 근거로 사용하지 않는다.

AI가 반환한 구절은 해당 소개에 실제로 포함돼야 한다. 잘못된 ID·중복 근거·창작한 구절은 채택하지 않는다. AI가 실패하면 실제 장소와 확인된 사실을 반환하고 안내한다. 연속한 장소의 좌표로 계산한 직선거리가 20km를 넘으면 외부 지도 확인을 안내하며 도로 거리나 이동 분 수로 표시하지 않는다.

### 추가 관광 콘텐츠

사진 요청은 `city`(null 또는 강원 시군), `keyword`(최대 40자), `page`(1~5)를 받는다. 응답 사진의 `id`는 `photo_` 접두사이며 실제 관광 장소 ID가 아니다. 촬영지·촬영자·키워드·이미지 주소를 표시한다. 사진 속 정확한 장소와 좌표를 단정하지 않고 ‘이 지역 장소 찾기’로 해당 시군의 관광 후보를 새로 검색한다.

이야기와 연관 자료는 상세의 해당 버튼을 누른 경우에만 조회한다. 먼저 실제 국문 장소 상세를 검증한다. 오디는 한국어 관광지명 일치와 양쪽에 좌표가 있으면 2km 이내 여부를 대조한다. 좌표가 없으면 이름만 대조했다는 사실을 표시한다. 원본 음성은 `preload="none"`인 재생 컨트롤로 제공하며 재생 실패 때 대본을 읽을 수 있다. AI로 원본 역사를 창작하지 않는다.

연관 서비스는 공식 코드표의 강원 `51`과 별도 시군 코드를 사용한다. 국문 코드 `32`와 혼용하지 않는다. 기준월·중심 관광지명·지역을 대조하고 상위 최대 다섯 후보를 반환한다. 각 `candidate.place`는 국문 관광정보에서 전체 이름을 정규화해 일치하고 실제 주소·지역을 확인한 단일 장소만 담는다. 띄어쓰기 때문에 전체 검색이 비면 짧은 검색어로 후보를 조회하지만 채택은 여전히 전체 이름 일치다. 둘 이상의 서로 다른 ID가 일치하거나 정보가 없으면 null이며 후보 추가 버튼을 제공하지 않는다. 숙박 유형은 당일 코스 후보로 연결하지 않는다.

현재 조건에 맞는 확인된 연관 장소는 후보 목록에만 추가하고 사용자가 직접 선택한다. 다른 시군·유형이면 조건 편집 화면에 새 조건을 준비한다. 새 검색 성공 전에는 이전 선택을 유지한다. 추가 API 실패·빈 응답은 해당 영역에서 처리하고 기본 장소 소개·검색을 유지한다.

추가 자료가 비면 `notices`로 현재 이름의 검색 결과가 없는 경우와 검색 결과가 있지만 대조 조건에 맞지 않는 경우를 구분해 안내한다. 빈 결과는 정상 조회이며 모든 관광지에서 추가 자료가 제공된다는 뜻은 아니다. 화면은 조회 완료와 연결된 자료 없음, 장소 소개로 돌아가는 버튼을 표시한다. 별칭이 다른 같은 장소인지 확인하지 못한 자료나 이름만 비슷한 다른 장소의 자료를 임의로 연결하지 않는다.

사진은 확인한 한국관광공사 이미지 호스트, 음성은 확인한 오디 CDN의 HTTPS 공개 주소만 제공한다. 인증키는 포함하지 않는다. 공개 콘텐츠 주소가 있다는 것과 실제 미디어 재생 성공은 구분한다.

### 방문 편의정보

상세의 ‘방문 편의정보’를 누를 때만 `KorWithService2`를 조회한다. 국문 장소 ID를 동일 ID라고 단정하지 않고 공통정보의 조회 후보로 사용한다. 반환된 유형·관광지명·전체 주소를 대조하고 양쪽 좌표가 있으면 200m 이내인지 확인한다. 확인이 안 되면 무장애 서비스 자체 지역코드 목록의 강원·시군 코드로 이름 검색 후 같은 조건을 대조한다. 서로 다른 ID가 둘 이상 일치하면 연결하지 않는다.

확인한 무장애 장소 ID로 `detailWithTour2`를 조회하고 응답 ID도 다시 확인한다. 허용한 편의 항목 중 값이 있는 항목만 `fields`의 key·label·group·value로 제공한다. 이동·시설, 시각·청각 안내, 영유아 동반으로 표시하며 원문을 정리해 텍스트로 출력한다. `matched`는 같은 장소를 확인했다는 뜻이며 이용 가능 판정이 아니다. `sourceModifiedDate`는 제공된 장소 자료의 수정일이지 개별 편의시설의 현장 확인일이 아니다.

빈 결과에는 미등록·이름 차이·동명 등으로 장소 연결을 못 한 경우와 동일 장소지만 편의 항목이 없는 경우를 안내한다. 이용 가능·불가를 추정하지 않는다. 실패는 재시도 안내로 처리하고 장소 소개와 기존 검색을 유지한다. 시설 조건 검색·추천 필터와 LLM 편의 판정은 이번 확장에 포함하지 않는다.

### 오류

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "입력 조건이나 선택한 장소를 확인해주세요.",
    "retryable": false
  }
}
```

사용자 메시지는 한국어다. 외부 인증키·인증 URL·원문 오류는 전달하지 않는다. 빈 검색 결과와 연결 실패는 구분한다.

## 7. 저장과 실행

localStorage에는 버전·ID 순서·최종 조건·저장 시각만 저장한다. 복원할 때 형식을 검사하고 서버에서 실제 관광 정보를 다시 조회한다. 새 저장 키는 `storyroute.day-trip.v2`다. 기존 v1의 강릉 조건은 강원도·강릉시로 변환해 읽고 실제 장소를 다시 검증한다. 원래 v1 저장을 삭제하지 않는다. 저장 이름은 ‘이 브라우저에 코스 저장’이며 기기 간 동기화를 제공하지 않는다.

Next.js의 내부 경로 연결 주소는 `web/.env.local`의 `API_BASE_URL`로 설정한다. 경로 연결은 빌드 설정에 포함되므로 운영 주소가 바뀌면 다시 빌드한다. 기본 주소는 `http://127.0.0.1:8000`이다. 관광·LLM 인증키는 서버 `.env`의 설정에서 관리한다.

## 8. 완료 확인

프런트 빌드·타입·린트, 외부 키가 없는 백엔드 흐름·실패 테스트를 실행한다. 실제 관광 조회와 AI 모의 응답 검증을 구분한다. 모바일·태블릿·PC 배치, 선택·교체·순서·상세·저장·복원은 화면에서 별도 확인하고 [검증 기록](VALIDATION.md)에 결과를 적는다.
