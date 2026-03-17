from __future__ import annotations

import base64
import datetime as dt
import hmac
import secrets
from hashlib import sha256
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

from settings import settings


def hash_password(password: str) -> str:
    pw = password.encode("utf-8")
    hashed = bcrypt.hashpw(pw, bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def create_access_token(*, sub: str, role: str) -> str:
    exp = _now() + dt.timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": sub, "role": role, "type": "access", "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def create_refresh_token(*, sub: str, role: str, jti: Optional[str] = None) -> tuple[str, str]:
    exp = _now() + dt.timedelta(days=settings.refresh_token_expire_days)
    jti = jti or secrets.token_urlsafe(24)
    payload = {"sub": sub, "role": role, "type": "refresh", "jti": jti, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg), jti


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])


def safe_decode_token(token: str) -> Optional[dict[str, Any]]:
    try:
        return decode_token(token)
    except JWTError:
        return None


def sign_audit(*, user_id: Optional[int], action: str, entity_type: str, entity_id: Optional[int], message: str, created_at: dt.datetime) -> str:
    # Repudiation mitigation: stable, tamper-evident signature (HMAC-SHA256).
    # Keep format explicit to avoid ambiguities.
    payload = f"{user_id}|{action}|{entity_type}|{entity_id}|{created_at.isoformat()}|{message}".encode("utf-8")
    mac = hmac.new(settings.audit_log_secret.encode("utf-8"), payload, sha256).digest()
    return base64.urlsafe_b64encode(mac).decode("ascii").rstrip("=")

