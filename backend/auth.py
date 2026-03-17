from __future__ import annotations

import datetime as dt
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

import crud
import models
import schemas
from database import get_db
from deps import get_refresh_cookie
from rate_limit import limiter
from security import create_access_token, create_refresh_token, safe_decode_token
from settings import settings


router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(resp: Response, refresh_token: str) -> None:
    resp.set_cookie(
        key="tb_refresh",
        value=refresh_token,
        httponly=True,
        secure=bool(settings.cookie_secure),
        samesite=settings.cookie_samesite,
        max_age=int(dt.timedelta(days=settings.refresh_token_expire_days).total_seconds()),
        path="/",
    )


def _clear_refresh_cookie(resp: Response) -> None:
    resp.delete_cookie(key="tb_refresh", path="/")


@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.RegisterIn, request: Request, db: Session = Depends(get_db)):
    u = crud.create_user(db, email=str(payload.email).lower(), password=payload.password)
    db.commit()
    return schemas.UserOut(id=u.id, email=u.email, role=u.role.value, balance_tokens=u.balance_tokens)


@router.post("/login", response_model=schemas.TokenPair)
def login(payload: schemas.LoginIn, request: Request, resp: Response, db: Session = Depends(get_db)):
    u = crud.authenticate(db, email=str(payload.email).lower(), password=payload.password)
    access = create_access_token(sub=str(u.id), role=u.role.value)
    refresh, _jti = create_refresh_token(sub=str(u.id), role=u.role.value)
    _set_refresh_cookie(resp, refresh)
    crud.create_audit(db, user_id=u.id, action="auth.login", entity_type="user", entity_id=u.id, message="User logged in")
    db.commit()
    return schemas.TokenPair(access_token=access)


@router.post("/refresh", response_model=schemas.TokenPair)
def refresh(request: Request, resp: Response, refresh_cookie: str = Depends(get_refresh_cookie), db: Session = Depends(get_db)):
    payload = safe_decode_token(refresh_cookie)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    sub = payload.get("sub")
    role = payload.get("role")
    if not sub or not role or not str(sub).isdigit():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    u = db.get(models.User, int(sub))
    if not u:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Rotate refresh token on refresh (mitigates replay)
    new_refresh, _jti = create_refresh_token(sub=str(u.id), role=u.role.value)
    _set_refresh_cookie(resp, new_refresh)
    access = create_access_token(sub=str(u.id), role=u.role.value)
    crud.create_audit(db, user_id=u.id, action="auth.refresh", entity_type="user", entity_id=u.id, message="Token refreshed")
    db.commit()
    return schemas.TokenPair(access_token=access)


@router.post("/logout", response_model=schemas.Msg)
def logout(request: Request, resp: Response, refresh_cookie: Optional[str] = Depends(get_refresh_cookie), db: Session = Depends(get_db)):
    # Best-effort audit (refresh may be invalid)
    payload = safe_decode_token(refresh_cookie) if refresh_cookie else None
    user_id = int(payload["sub"]) if payload and str(payload.get("sub", "")).isdigit() else None
    if user_id:
        crud.create_audit(db, user_id=user_id, action="auth.logout", entity_type="user", entity_id=user_id, message="User logged out")
        db.commit()
    _clear_refresh_cookie(resp)
    return schemas.Msg(message="Logged out")

