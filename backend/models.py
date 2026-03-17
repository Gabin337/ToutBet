from __future__ import annotations

import datetime as dt
import enum
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Role(str, enum.Enum):
    user = "user"
    admin = "admin"


class MarketStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"


class Outcome(str, enum.Enum):
    yes = "yes"
    no = "no"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False, default=Role.user)

    balance_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))

    markets: Mapped[list["Market"]] = relationship(back_populates="creator", foreign_keys="Market.creator_id")
    resolved_markets: Mapped[list["Market"]] = relationship(foreign_keys="Market.resolved_by_admin_id")
    bets: Mapped[list["Bet"]] = relationship(back_populates="user")


class Market(Base):
    __tablename__ = "markets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[MarketStatus] = mapped_column(Enum(MarketStatus), nullable=False, default=MarketStatus.open)
    resolved_outcome: Mapped[Optional[Outcome]] = mapped_column(Enum(Outcome), nullable=True)
    resolved_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by_admin_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    yes_pool: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    no_pool: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))

    creator: Mapped["User"] = relationship(back_populates="markets", foreign_keys=[creator_id])
    bets: Mapped[list["Bet"]] = relationship(back_populates="market")

    __table_args__ = (
        CheckConstraint("yes_pool >= 0", name="ck_market_yes_pool_nonneg"),
        CheckConstraint("no_pool >= 0", name="ck_market_no_pool_nonneg"),
    )


class Bet(Base):
    __tablename__ = "bets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id", ondelete="RESTRICT"), index=True, nullable=False)

    side: Mapped[Outcome] = mapped_column(Enum(Outcome), nullable=False)
    amount_tokens: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))

    # Settlement (immutable once set; enforced via app logic + audit log)
    settled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    won: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    payout_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    user: Mapped["User"] = relationship(back_populates="bets")
    market: Mapped["Market"] = relationship(back_populates="bets")

    __table_args__ = (
        CheckConstraint("amount_tokens > 0", name="ck_bet_amount_pos"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))

    # Repudiation mitigation: signed payload
    signature: Mapped[str] = mapped_column(String(128), nullable=False)

