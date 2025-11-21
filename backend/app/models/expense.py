from typing import List, Optional, Dict
from datetime import datetime
from beanie import Document
from pydantic import Field
from enum import Enum

class SplitType(str, Enum):
    EQUAL = "equal"
    EXACT = "exact"
    PERCENT = "percent"

class Split(Document):
    user_id: str
    amount: float
    paid: float = 0.0  # Amount already paid by this user
    
class Expense(Document):
    description: str
    amount: float
    paid_by: str  # User ID who paid
    group_id: Optional[str] = None  # Optional group ID
    split_type: SplitType = SplitType.EQUAL
    splits: List[Dict] = Field(default_factory=list)  # List of {user_id, amount, paid}
    category: Optional[str] = "general"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str  # User ID
    settled: bool = False
    
    class Settings:
        name = "expenses"
        
    class Config:
        json_schema_extra = {
            "example": {
                "description": "Dinner at restaurant",
                "amount": 1500.0,
                "paid_by": "user_id_1",
                "split_type": "equal",
                "splits": [
                    {"user_id": "user_id_1", "amount": 500, "paid": 0},
                    {"user_id": "user_id_2", "amount": 500, "paid": 0},
                    {"user_id": "user_id_3", "amount": 500, "paid": 0}
                ]
            }
        }
