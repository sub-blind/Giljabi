from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass
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
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token format.") from exc

    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    expected_signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    actual_signature = _b64url_decode(encoded_signature)
    if not hmac.compare_digest(expected_signature, actual_signature):
        raise HTTPException(status_code=401, detail="Invalid token signature.")

    try:
        payload = json.loads(_b64url_decode(encoded_payload))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=401, detail="Invalid token payload.") from exc

    now = int(time.time())
    exp = payload.get("exp")
    if not isinstance(exp, int) or exp <= now:
        raise HTTPException(status_code=401, detail="Token expired.")

    token_type = payload.get("type")
    if expected_type and token_type != expected_type:
        raise HTTPException(status_code=401, detail="Unexpected token type.")
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


@dataclass(slots=True)
class RefreshSession:
    jti: str
    user_id: str
    token_hash: str
    expires_at: int
    provider: str
    nickname: str | None
    email: str | None


class RefreshSessionStore:
    def __init__(self) -> None:
        self._items: dict[str, RefreshSession] = {}

    def save(self, session: RefreshSession) -> None:
        self._items[session.jti] = session

    def get(self, jti: str) -> RefreshSession | None:
        session = self._items.get(jti)
        if not session:
            return None
        if session.expires_at <= utc_now():
            self._items.pop(jti, None)
            return None
        return session

    def delete(self, jti: str) -> None:
        self._items.pop(jti, None)

    def cleanup(self) -> None:
        now = utc_now()
        expired = [jti for jti, session in self._items.items() if session.expires_at <= now]
        for jti in expired:
            self._items.pop(jti, None)


refresh_session_store = RefreshSessionStore()
