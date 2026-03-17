from __future__ import annotations

from sqlalchemy.orm import Session

import crud
import models
from database import SessionLocal


ADMIN_EMAIL = "admin@toutbet.com"
ADMIN_PASSWORD = "admin123"


def main() -> None:
    db: Session = SessionLocal()
    try:
        existing = crud.get_user_by_email(db, ADMIN_EMAIL)
        if existing:
            if existing.role != models.Role.admin:
                existing.role = models.Role.admin
                db.commit()
            print("Admin already exists:", ADMIN_EMAIL)
            return
        crud.create_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, role=models.Role.admin)
        db.commit()
        print("Admin created:", ADMIN_EMAIL, "password:", ADMIN_PASSWORD)
    finally:
        db.close()


if __name__ == "__main__":
    main()

