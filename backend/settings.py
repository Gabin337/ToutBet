from __future__ import annotations

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "ToutBet'"
    env: str = "dev"
    debug: bool = False

    database_url: str = "sqlite:///./toutbet.db"

    jwt_secret: str
    jwt_alg: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    audit_log_secret: str

    frontend_origins: str = "http://127.0.0.1:5173"

    cookie_secure: bool = False
    cookie_samesite: str = "lax"  # strict|lax|none

    rate_limit_default: str = "60/minute"

    def parsed_origins(self) -> list[str]:
        # Keep it simple and explicit (avoid wildcard CORS)
        return [o.strip() for o in self.frontend_origins.split(",") if o.strip()]


settings = Settings()

