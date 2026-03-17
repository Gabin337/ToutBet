from __future__ import annotations

from database import Base, engine
import models  # noqa: F401  (ensure models imported)


def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("DB initialized.")


if __name__ == "__main__":
    main()

