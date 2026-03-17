from __future__ import annotations

import datetime as dt
import random
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

import models
from security import hash_password, sign_audit, verify_password


def create_audit(
    db: Session,
    *,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int],
    message: str,
) -> models.AuditLog:
    created_at = dt.datetime.now(dt.timezone.utc)
    sig = sign_audit(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        message=message,
        created_at=created_at,
    )
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        message=message,
        created_at=created_at,
        signature=sig,
    )
    db.add(log)
    return log


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.scalar(select(models.User).where(models.User.email == email))


def create_user(db: Session, *, email: str, password: str, role: models.Role = models.Role.user) -> models.User:
    if get_user_by_email(db, email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    u = models.User(email=email, password_hash=hash_password(password), role=role, balance_tokens=0)
    db.add(u)
    db.flush()
    create_audit(db, user_id=u.id, action="user.register", entity_type="user", entity_id=u.id, message="User registered")
    return u


def authenticate(db: Session, *, email: str, password: str) -> models.User:
    u = get_user_by_email(db, email)
    if not u or not verify_password(password, u.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return u


def fund_user(db: Session, *, user: models.User, amount_eur: int) -> models.User:
    # Mock top-up: 1 EUR = 1 token
    user.balance_tokens += amount_eur
    create_audit(db, user_id=user.id, action="wallet.fund", entity_type="user", entity_id=user.id, message=f"Funded {amount_eur} tokens")
    return user


def create_market(db: Session, *, creator: models.User, title: str, description: str) -> models.Market:
    m = models.Market(creator_id=creator.id, title=title, description=description)
    db.add(m)
    db.flush()
    create_audit(db, user_id=creator.id, action="market.create", entity_type="market", entity_id=m.id, message="Market created")
    return m


def compute_probs(market: models.Market) -> tuple[float, float]:
    total = market.yes_pool + market.no_pool
    if total <= 0:
        # For tests: random between 40-60%.
        prob_yes = random.uniform(0.4, 0.6)
        return prob_yes, 1.0 - prob_yes
    # MUST follow spec example: prob_yes = no_pool / total_pool
    prob_yes = market.no_pool / total
    prob_no = market.yes_pool / total
    return float(prob_yes), float(prob_no)


def place_bet(db: Session, *, user: models.User, market: models.Market, side: models.Outcome, amount_tokens: int) -> models.Bet:
    if market.status != models.MarketStatus.open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Market not open")
    if market.creator_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot bet on your own market")
    if amount_tokens <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid amount")
    if user.balance_tokens < amount_tokens:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")

    user.balance_tokens -= amount_tokens
    if side == models.Outcome.yes:
        market.yes_pool += amount_tokens
    else:
        market.no_pool += amount_tokens

    b = models.Bet(user_id=user.id, market_id=market.id, side=side, amount_tokens=amount_tokens)
    db.add(b)
    db.flush()
    create_audit(db, user_id=user.id, action="bet.place", entity_type="bet", entity_id=b.id, message=f"Placed {amount_tokens} on {side}")
    return b


def resolve_market(db: Session, *, admin: models.User, market: models.Market, outcome: models.Outcome) -> models.Market:
    if admin.role != models.Role.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    if market.status != models.MarketStatus.open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Market already resolved")

    total_pool = market.yes_pool + market.no_pool
    winning_pool = market.yes_pool if outcome == models.Outcome.yes else market.no_pool

    # Commissions: 10% total (5% platform + 5% bookie) taken before redistribution
    commission_total = (total_pool * 10) // 100
    platform_fee = commission_total // 2
    bookie_fee = commission_total - platform_fee
    distributable = total_pool - commission_total

    # Credit bookie fee to creator (only if pool > 0)
    creator = db.get(models.User, market.creator_id)
    if creator and bookie_fee > 0:
        creator.balance_tokens += bookie_fee

    # Redistribute proportionally to winners; if no winners (winning_pool == 0), distributable stays unassigned.
    winners = list(db.scalars(select(models.Bet).where(models.Bet.market_id == market.id, models.Bet.side == outcome)))
    if winning_pool > 0 and distributable > 0 and winners:
        # integer proportional payout: floor per bet; remainder goes to platform_fee (implicit)
        paid = 0
        for b in winners:
            payout = (distributable * b.amount_tokens) // winning_pool
            paid += payout
            b.settled = True
            b.won = True
            b.payout_tokens = payout
            u = db.get(models.User, b.user_id)
            if u and payout > 0:
                u.balance_tokens += payout
        remainder = distributable - paid
        platform_fee += remainder

    # Mark losers
    losers = list(db.scalars(select(models.Bet).where(models.Bet.market_id == market.id, models.Bet.side != outcome)))
    for b in losers:
        b.settled = True
        b.won = False
        b.payout_tokens = 0

    market.status = models.MarketStatus.resolved
    market.resolved_outcome = outcome
    market.resolved_at = dt.datetime.now(dt.timezone.utc)
    market.resolved_by_admin_id = admin.id

    create_audit(db, user_id=admin.id, action="market.resolve", entity_type="market", entity_id=market.id, message=f"Resolved market to {outcome} (platform_fee={platform_fee}, bookie_fee={bookie_fee})")
    return market

