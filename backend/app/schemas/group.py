from typing import Optional, List, Dict
from pydantic import BaseModel
from datetime import datetime

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    members: List[str] = []  # List of user IDs

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class GroupResponse(GroupBase):
    id: str
    members: List[str]
    member_details: List[Dict[str, str]] = []
    created_by: str
    created_at: datetime
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class AddMemberRequest(BaseModel):
    user_id: str
