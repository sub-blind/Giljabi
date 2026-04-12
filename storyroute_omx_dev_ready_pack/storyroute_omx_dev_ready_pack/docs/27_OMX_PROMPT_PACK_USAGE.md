# 27. OMX 프롬프트 팩 사용법

## 1. 이 프롬프트 팩의 목적

OmX에게 긴 설명을 매번 새로 쓰지 않고, **단계별 상세 지시를 안정적으로 재사용**하기 위함이다.

## 2. 사용 방식

### 가장 권장
세션 안에서 짧은 호출만 하고, 실제 상세 지시는 `/input/docs/prompts/*.prompt.txt`를 읽게 한다.

예:
```text
$ralph "Read /input/docs/prompts/02_M1_HOME_SEARCH.prompt.txt and execute it exactly."
```

## 3. 왜 이 방식이 좋은가

- 긴 프롬프트를 매번 다시 붙여넣지 않아도 된다.
- 어떤 milestone에서 어떤 지시를 썼는지 추적이 쉽다.
- 세션마다 wording drift가 줄어든다.
- OmX가 반복 작업에서 더 일관되게 동작한다.

## 4. 프롬프트 작성 원칙

각 프롬프트는 다음을 포함한다.

1. 읽어야 할 파일
2. 해야 할 일
3. 수정 가능한 파일 범위
4. 수정하면 안 되는 것
5. 완료 조건
6. 실행할 검증 명령
7. 저장할 리포트 경로

## 5. 실무 팁

- 첫 세션은 반드시 `00_GLOBAL_REPO_AUDIT`부터 시작한다.
- 바로 구현하지 말고, 먼저 gap analysis와 plan을 남긴다.
- 병렬 작업은 contract가 고정된 후에만 쓴다.
- provider adapter는 M2 전에는 붙이지 않는다.
- release prompt는 항상 마지막에 쓴다.
