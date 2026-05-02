from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "NLP VA Backend"
    debug: bool = True
    allowed_origins: list[str] = ["*"]
    supabase_url: str
    supabase_key: str
    hf_token: str
    app_host: str = "127.0.0.1"
    app_port: int = 8000
    frontend_host: str = "http://localhost"
    frontend_port: int = 5173

    class Config:
        env_file = ".env"


settings = Settings()