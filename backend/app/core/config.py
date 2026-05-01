from pydantic import BaseSettings


class Settings(BaseSettings):
    app_name: str = "NLP VA Backend"
    debug: bool = True
    allowed_origins: list[str] = ["*"]
    supabase_url: str
    supabase_key: str

    class Config:
        env_file = ".env"


settings = Settings()