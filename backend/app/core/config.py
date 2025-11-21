from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017/splitwise"
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    google_client_id: str = ""
    google_client_secret: str = ""
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
