from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)


def create_admin_token(subject: str) -> str:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(hours=settings.admin_token_expire_hours)
    payload = {"sub": subject, "exp": expires, "role": "admin"}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_admin_token(token: str) -> dict[str, Any] | None:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    if payload.get("role") != "admin":
        return None
    return payload


def verify_admin_credentials(username: str, password: str) -> bool:
    from app.services.admin_service import verify_admin_credentials as verify_stored

    return verify_stored(username, password)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
        )

    payload = decode_admin_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin token",
        )
    return payload
