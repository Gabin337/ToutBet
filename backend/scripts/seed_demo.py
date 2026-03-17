from __future__ import annotations

import random
import string

from sqlalchemy import select
from sqlalchemy.orm import Session

import crud
import models
from database import SessionLocal


def _rand_title() -> str:
    topics = [
        "Crypto",
        "Foot",
        "Météo",
        "Politique",
        "Esport",
        "Tech",
        "Cinéma",
        "Gaming",
        "Bourse",
        "Tennis",
    ]
    verbs = [
        "dépasse",
        "atteint",
        "gagne",
        "perd",
        "annonce",
        "sort",
        "baisse sous",
        "monte au-dessus de",
        "est reporté",
    ]
    a = random.choice(topics)
    b = random.choice(verbs)
    n = random.choice([10, 20, 50, 100, 250, 500])
    return f"{a} : {b} {n} ?"


def _rand_desc() -> str:
    sources = ["source officielle", "communiqué", "score final", "météo locale", "site du tournoi", "release notes"]
    return (
        "Marché de test pour simuler une plateforme active. "
        f"Résolution basée sur {random.choice(sources)}. "
        "Conditions: Oui/Non sans ambiguïté."
    )


def main() -> None:
    db: Session = SessionLocal()
    try:
        existing_markets = db.scalar(select(models.Market.id).limit(1))
        if existing_markets:
            print("Seed skipped: markets already exist.")
            return

        # Ensure admin exists
        admin = crud.get_user_by_email(db, "admin@toutbet.com")
        if not admin:
            admin = crud.create_user(db, email="admin@toutbet.com", password="admin123", role=models.Role.admin)

        # Create a few regular users
        users: list[models.User] = []
        for i in range(12):
            email = f"user{i+1}@toutbet.test"
            u = crud.get_user_by_email(db, email)
            if not u:
                u = crud.create_user(db, email=email, password="password123", role=models.Role.user)
            u.balance_tokens = 5000
            users.append(u)

        db.commit()

        # Create markets
        markets: list[models.Market] = []
        for _ in range(24):
            creator = random.choice(users)
            m = crud.create_market(db, creator=creator, title=_rand_title(), description=_rand_desc())
            markets.append(m)

        db.commit()

        # Place bets to fill pools (avoid creator betting)
        for m in markets:
            bettors = [u for u in users if u.id != m.creator_id]
            for _ in range(random.randint(8, 40)):
                u = random.choice(bettors)
                side = random.choice([models.Outcome.yes, models.Outcome.no])
                amt = random.randint(5, 250)
                if u.balance_tokens < amt:
                    continue
                crud.place_bet(db, user=u, market=m, side=side, amount_tokens=amt)

        db.commit()

        # Resolve a subset
        to_resolve = random.sample(markets, k=10)
        for m in to_resolve:
            outcome = random.choice([models.Outcome.yes, models.Outcome.no])
            crud.resolve_market(db, admin=admin, market=m, outcome=outcome)

        db.commit()
        print("Seed complete: created demo users, markets, bets, and resolved some markets.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

