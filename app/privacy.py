"""선택한 안내 버전만 외부 AI 사용에 적용한다."""

POLICY_VERSION = "2026-09-30"


def allows_ai(consent: bool, version: str | None) -> bool:
    return consent is True and version == POLICY_VERSION
