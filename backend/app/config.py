import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # AI / LLM Configuration
    GROQ_API_KEY: str = ""
    LLM_MODEL: str = "groq/compound-mini"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://bharathreddy@localhost:5432/pharma_qms"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
