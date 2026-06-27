"""
MeetMind Backend Configuration
Reads settings from environment variables / .env file.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./meetmind.db"

    # AI
    ANTHROPIC_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # App
    APP_NAME: str = "MeetMind API"
    API_VERSION: str = "v1"
    DEBUG: bool = True

    # Auth (placeholder — replace with JWT in production)
    DEFAULT_USER_ID: str = "00000000-0000-0000-0000-000000000001"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
