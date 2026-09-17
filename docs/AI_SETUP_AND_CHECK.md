# 실제 AI 연결과 확인

2026년 9월 17일 · 현재 실제 LLM 호출은 미검증

## 현재 상태

조건 해석과 최종 코스의 근거 선택은 구현했다. 모의 응답으로 정해진 JSON 형식·시군 검증·소개 원문 대조·실패 대응을 검사했다. 현재 서버에서 인증키와 모델이 함께 준비되지 않아 실제 AI 연결 완료로 표시하지 않는다. 관광 검색과 직접 조건 선택은 사용할 수 있다.

## 서버 설정

Tourism 루트의 서버 `.env`에 다음 두 항목을 설정하고 백엔드를 다시 시작한다. 실제 값은 프런트 환경변수나 문서·소스에 넣지 않는다.

| 설정 | 값 |
|---|---|
| `OPENAI_API_KEY` | 사용하는 API 계정의 인증키 |
| `OPENAI_MODEL` | 해당 계정에서 사용 가능하고 Responses API의 구조화 출력을 지원하는 모델 ID |

모델 이름을 임의로 추정하지 않는다. 계정의 실제 사용 가능 여부를 확인해 지정한다. 모델의 구조화 출력 안내는 [공식 문서](https://developers.openai.com/api/docs/guides/structured-outputs)를 참고한다.

## 최소 연결 확인

README의 기본 백엔드 주소를 기준으로 PowerShell에서 실행한다. 현재 로컬 미리보기용 백엔드를 직접 확인하려면 포트를 8017로 바꾼다.

```powershell
$storyrouteApi = 'http://127.0.0.1:8000/api/v1/day-trip'
Invoke-RestMethod -Uri "$storyrouteApi/status"

$storyrouteBody = @{ query = '춘천에서 박물관 보고 식사하는 하루 여행' } | ConvertTo-Json
$storyrouteResult = Invoke-RestMethod -Uri "$storyrouteApi/intent" -Method Post `
    -ContentType 'application/json; charset=utf-8' `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($storyrouteBody))
$storyrouteResult | ConvertTo-Json -Depth 6
```

`aiReady: true`는 키·모델 설정 여부다. 실제 해석 요청의 `mode: ai`와 올바른 조건 반환까지 확인해야 연결 성공으로 기록한다. `mode: manual`이면 설정·모델 접근·응답 형식·연결 상태를 확인한다. 서버의 실패 대응 때문에 HTTP 200만으로 LLM 성공을 판단하지 않는다.

## 평가할 사례

| 입력·행동 | 확인 기준 |
|---|---|
| 강원도 바다와 카페 | `region: gangwon`, 특정 시군이 없으면 `city: null`, 지원 유형만 추출 |
| 춘천 박물관과 식사 | 춘천시와 문화·음식 관심 추출 |
| 평창 명소 하루 | 평창군으로 해석, 당일 유지 |
| 강릉에서 조용한 산책 | 강릉시, 조용함은 희망이며 혼잡 충족을 보장하지 않음 |
| 박물관 구경 | 박물관의 ‘박’을 숙박으로 오해하지 않음 |
| 서울 1박 2일 | 다른 지역·기간을 미지원 조건으로 알림, 서울 장소를 제공하지 않음 |
| 휠체어·반려동물·영업시간 요청 | 확인하지 못한 조건을 보장하지 않음 |
| 사용자가 시군·유형 수정 | 수정한 최종 조건으로 실제 검색, 이전 선택 초기화 안내 |
| 코스 근거 선택 | 실제 소개에 포함된 구절만 채택, 다른 ID·중복·창작 구절 거절 |
| API 실패·응답 거절·형식 오류 | 직접 조건 선택·실제 관광 검색·확인된 사실로 계속 진행 |

실제 호출 결과에는 실행 시각·입력·해석 결과·성공 여부·수정 내용만 기록하고 비밀키나 인증 URL은 기록하지 않는다. 이 표는 평가 기준이며 실제 모델의 성공률을 측정한 결과가 아니다.

## 포트폴리오 표현

현재 구현은 LLM 응용·출력 검증·실패 대응이다. 관광사진 API는 이미지 인식 모델이 아니다. TensorFlow 학습·이미지 분류·실제 LLM 평가 성공률은 해당 작업과 검증을 수행한 뒤 별도로 기록한다.
