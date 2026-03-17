from __future__ import annotations

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

import models
from database import get_db
from security import safe_decode_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    auth = request.headers.get("Authorization", "")
    token = ""
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id or not str(user_id).isdigit():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = db.get(models.User, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_admin(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != models.Role.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user


def get_refresh_cookie(refresh_token: str | None = Cookie(default=None, alias="tb_refresh")) -> str:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")
    return refresh_token

