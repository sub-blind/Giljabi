from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any

from fastapi import HTTPException


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _json_dumps(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")


def create_jwt(payload: dict[str, Any], secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    encoded_header = _b64url_encode(_json_dumps(header))
    encoded_payload = _b64url_encode(_json_dumps(payload))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def decode_jwt(token: str, secret: str, expected_type: str | None = None) -> dict[str, Any]:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
        header = json.loads(_b64url_decode(encoded_header))
        if not isinstance(header, dict) or header.get("alg") != "HS256":
            raise ValueError
        signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
        expected_signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected_signature, _b64url_decode(encoded_signature)):
            raise ValueError
        payload = json.loads(_b64url_decode(encoded_payload))
        if not isinstance(payload, dict):
            raise ValueError
        exp = payload.get("exp")
        if type(exp) is not int or exp <= int(time.time()):
            raise ValueError
        if expected_type and payload.get("type") != expected_type:
            raise ValueError
    except (ValueError, TypeError, UnicodeError, AttributeError):
        raise HTTPException(status_code=401, detail="인증 정보가 유효하지 않습니다. 다시 로그인해주세요.") from None
    return payload


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def utc_now() -> int:
    return int(time.time())


def future_ts(seconds: int) -> int:
    return utc_now() + seconds


def new_state_token() -> str:
    return secrets.token_urlsafe(32)


def new_jti() -> str:
    return secrets.token_urlsafe(24)
