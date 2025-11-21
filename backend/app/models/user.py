from typing import Optional, List
from datetime import datetime
from beanie import Document
from pydantic import EmailStr, Field

class User(Document):
    email: EmailStr
    username: str
    hashed_password: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    friends: List[str] = Field(default_factory=list)  # List of user IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "users"
        
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "full_name": "John Doe"
            }
        }
