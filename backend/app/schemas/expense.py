from typing import Optional, List, Dict
from pydantic import BaseModel
from datetime import datetime
from app.models.expense import SplitType

class SplitItem(BaseModel):
    user_id: str
    amount: float
    paid: float = 0.0

class ExpenseBase(BaseModel):
    description: str
    amount: float
    paid_by: str
    group_id: Optional[str] = None
    split_type: SplitType = SplitType.EQUAL
    category: Optional[str] = "general"
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    splits: List[SplitItem]

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    notes: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: str
    splits: List[Dict]
    created_at: datetime
    created_by: str
    settled: bool
    
    class Config:
        from_attributes = True

class SettleUpRequest(BaseModel):
    expense_id: str
    from_user_id: str
    to_user_id: str
    amount: float
