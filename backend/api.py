from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

import crud
import models
import schemas
from database import get_db
from deps import get_current_user, require_admin
from rate_limit import limiter


router = APIRouter(prefix="/api", tags=["api"])
public_router = APIRouter(prefix="/public", tags=["public"])


@router.get("/me", response_model=schemas.MeOut)
def me(user: models.User = Depends(get_current_user)):
    return schemas.MeOut(id=user.id, email=user.email, role=user.role.value, balance_tokens=user.balance_tokens)


@router.post("/fund", response_model=schemas.MeOut)
def fund(payload: schemas.FundingIn, request: Request, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    crud.fund_user(db, user=user, amount_eur=payload.amount_eur)
    db.commit()
    db.refresh(user)
    return schemas.MeOut(id=user.id, email=user.email, role=user.role.value, balance_tokens=user.balance_tokens)


@router.post("/markets", response_model=schemas.MarketOut, status_code=201)
def create_market(payload: schemas.MarketCreateIn, request: Request, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    m = crud.create_market(db, creator=user, title=payload.title, description=payload.description)
    db.commit()
    db.refresh(m)
    prob_yes, prob_no = crud.compute_probs(m)
    return schemas.MarketOut(
        id=m.id,
        creator_id=m.creator_id,
        title=m.title,
        description=m.description,
        status=m.status.value,
        resolved_outcome=m.resolved_outcome.value if m.resolved_outcome else None,
        yes_pool=m.yes_pool,
        no_pool=m.no_pool,
        created_at=m.created_at,
        prob_yes=prob_yes,
        prob_no=prob_no,
    )


@router.get("/markets", response_model=list[schemas.MarketOut])
def list_markets(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    markets = list(db.scalars(select(models.Market).order_by(models.Market.created_at.desc())))
    out: list[schemas.MarketOut] = []
    for m in markets:
        prob_yes, prob_no = crud.compute_probs(m)
        out.append(
            schemas.MarketOut(
                id=m.id,
                creator_id=m.creator_id,
                title=m.title,
                description=m.description,
                status=m.status.value,
                resolved_outcome=m.resolved_outcome.value if m.resolved_outcome else None,
                yes_pool=m.yes_pool,
                no_pool=m.no_pool,
                created_at=m.created_at,
                prob_yes=prob_yes,
                prob_no=prob_no,
            )
        )
    return out


@router.get("/markets/{market_id}", response_model=schemas.MarketOut)
def get_market(market_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    m = db.get(models.Market, market_id)
    if not m:
        raise HTTPException(status_code=404, detail="Market not found")
    prob_yes, prob_no = crud.compute_probs(m)
    return schemas.MarketOut(
        id=m.id,
        creator_id=m.creator_id,
        title=m.title,
        description=m.description,
        status=m.status.value,
        resolved_outcome=m.resolved_outcome.value if m.resolved_outcome else None,
        yes_pool=m.yes_pool,
        no_pool=m.no_pool,
        created_at=m.created_at,
        prob_yes=prob_yes,
        prob_no=prob_no,
    )


@public_router.get("/markets", response_model=list[schemas.MarketOut])
def public_list_markets(request: Request, db: Session = Depends(get_db)):
    markets = list(db.scalars(select(models.Market).order_by(models.Market.created_at.desc())))
    out: list[schemas.MarketOut] = []
    for m in markets:
        prob_yes, prob_no = crud.compute_probs(m)
        out.append(
            schemas.MarketOut(
                id=m.id,
                creator_id=m.creator_id,
                title=m.title,
                description=m.description,
                status=m.status.value,
                resolved_outcome=m.resolved_outcome.value if m.resolved_outcome else None,
                yes_pool=m.yes_pool,
                no_pool=m.no_pool,
                created_at=m.created_at,
                prob_yes=prob_yes,
                prob_no=prob_no,
            )
        )
    return out


@public_router.get("/markets/{market_id}", response_model=schemas.MarketOut)
def public_get_market(request: Request, market_id: int, db: Session = Depends(get_db)):
    m = db.get(models.Market, market_id)
    if not m:
        raise HTTPException(status_code=404, detail="Market not found")
    prob_yes, prob_no = crud.compute_probs(m)
    return schemas.MarketOut(
        id=m.id,
        creator_id=m.creator_id,
        title=m.title,
        description=m.description,
        status=m.status.value,
        resolved_outcome=m.resolved_outcome.value if m.resolved_outcome else None,
        yes_pool=m.yes_pool,
        no_pool=m.no_pool,
        created_at=m.created_at,
        prob_yes=prob_yes,
        prob_no=prob_no,
    )


@router.post("/markets/{market_id}/bets", response_model=schemas.BetOut, status_code=201)
def bet(payload: schemas.BetCreateIn, request: Request, market_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    m = db.get(models.Market, market_id)
    if not m:
        raise HTTPException(status_code=404, detail="Market not found")
    b = crud.place_bet(db, user=user, market=m, side=models.Outcome(payload.side), amount_tokens=payload.amount_tokens)
    db.commit()
    db.refresh(b)
    return schemas.BetOut(
        id=b.id,
        user_id=b.user_id,
        market_id=b.market_id,
        side=b.side.value,
        amount_tokens=b.amount_tokens,
        created_at=b.created_at,
        settled=b.settled,
        won=b.won,
        payout_tokens=b.payout_tokens,
    )


@router.get("/my-bets", response_model=list[schemas.MyBetOut])
def my_bets(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    bets = list(db.scalars(select(models.Bet).where(models.Bet.user_id == user.id).order_by(models.Bet.created_at.desc())))
    out: list[schemas.MyBetOut] = []
    for b in bets:
        m = db.get(models.Market, b.market_id)
        if not m:
            continue
        prob_yes, prob_no = crud.compute_probs(m)
        out.append(
            schemas.MyBetOut(
                bet=schemas.BetOut(
                    id=b.id,
                    user_id=b.user_id,
                    market_id=b.market_id,
                    side=b.side.value,
                    amount_tokens=b.amount_tokens,
                    created_at=b.created_at,
                    settled=b.settled,
                    won=b.won,
                    payout_tokens=b.payout_tokens,
                ),
                market=schemas.MarketOut(
                    id=m.id,
                    creator_id=m.creator_id,
                    title=m.title,
                    description=m.description,
                    status=m.status.value,
                    resolved_outcome=m.resolved_outcome.value if m.resolved_outcome else None,
                    yes_pool=m.yes_pool,
                    no_pool=m.no_pool,
                    created_at=m.created_at,
                    prob_yes=prob_yes,
                    prob_no=prob_no,
                ),
            )
        )
    return out


@router.get("/admin/markets/pending", response_model=list[schemas.MarketOut])
def admin_pending(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    markets = list(db.scalars(select(models.Market).where(models.Market.status == models.MarketStatus.open).order_by(models.Market.created_at.desc())))
    out: list[schemas.MarketOut] = []
    for m in markets:
        prob_yes, prob_no = crud.compute_probs(m)
        out.append(
            schemas.MarketOut(
                id=m.id,
                creator_id=m.creator_id,
                title=m.title,
                description=m.description,
                status=m.status.value,
                resolved_outcome=m.resolved_outcome.value if m.resolved_outcome else None,
                yes_pool=m.yes_pool,
                no_pool=m.no_pool,
                created_at=m.created_at,
                prob_yes=prob_yes,
                prob_no=prob_no,
            )
        )
    return out


@router.post("/admin/markets/{market_id}/resolve", response_model=schemas.MarketOut)
def admin_resolve(market_id: int, payload: schemas.ResolveIn, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    m = db.get(models.Market, market_id)
    if not m:
        raise HTTPException(status_code=404, detail="Market not found")
    crud.resolve_market(db, admin=admin, market=m, outcome=models.Outcome(payload.outcome))
    db.commit()
    db.refresh(m)
    prob_yes, prob_no = crud.compute_probs(m)
    return schemas.MarketOut(
        id=m.id,
        creator_id=m.creator_id,
        title=m.title,
        description=m.description,
        status=m.status.value,
        resolved_outcome=m.resolved_outcome.value if m.resolved_outcome else None,
        yes_pool=m.yes_pool,
        no_pool=m.no_pool,
        created_at=m.created_at,
        prob_yes=prob_yes,
        prob_no=prob_no,
    )

