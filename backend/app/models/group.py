from typing import List, Optional
from datetime import datetime
from beanie import Document
from pydantic import Field

class Group(Document):
    name: str
    description: Optional[str] = None
    members: List[str] = Field(default_factory=list)  # List of user IDs
    created_by: str  # User ID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    image_url: Optional[str] = None
    
    class Settings:
        name = "groups"
        
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Trip to Goa",
                "description": "Vacation expenses",
                "members": ["user_id_1", "user_id_2"]
            }
        }
