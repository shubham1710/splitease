from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.models.expense import Expense
from app.models.user import User
from app.models.group import Group
from app.api.v1.endpoints.auth import get_current_user
from beanie import PydanticObjectId

router = APIRouter()

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new expense"""
    # Verify group if group_id is provided
    if expense_data.group_id:
        group = await Group.get(PydanticObjectId(expense_data.group_id))
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )
        if str(current_user.id) not in group.members:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this group"
            )
    
    # Convert splits to dict
    splits_dict = [split.model_dump() for split in expense_data.splits]
    
    expense = Expense(
        description=expense_data.description,
        amount=expense_data.amount,
        paid_by=expense_data.paid_by,
        group_id=expense_data.group_id,
        split_type=expense_data.split_type,
        splits=splits_dict,
        category=expense_data.category,
        notes=expense_data.notes,
        created_by=str(current_user.id)
    )
    await expense.insert()
    
    return ExpenseResponse(
        id=str(expense.id),
        description=expense.description,
        amount=expense.amount,
        paid_by=expense.paid_by,
        group_id=expense.group_id,
        split_type=expense.split_type,
        splits=expense.splits,
        category=expense.category,
        notes=expense.notes,
        created_at=expense.created_at,
        created_by=expense.created_by,
        settled=expense.settled
    )

@router.get("/")
async def get_expenses(
    group_id: str = None,
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Get expenses (optionally filtered by group) with pagination"""
    # Treat empty string as None
    if group_id == "":
        group_id = None
        
    if group_id:
        # Get expenses for a specific group
        group = await Group.get(PydanticObjectId(group_id))
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )
        if str(current_user.id) not in group.members:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this group"
            )
        query = {"group_id": group_id}
    else:
        # Get all expenses (both group and non-group) where user is involved
        user_id = str(current_user.id)
        query = {
            "$or": [
                {"paid_by": user_id},
                {"splits.user_id": user_id}
            ]
        }
    
    # Get total count
    total_count = await Expense.find(query).count()
    
    # Get paginated expenses
    expenses = await Expense.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    
    expenses_list = [
        ExpenseResponse(
            id=str(expense.id),
            description=expense.description,
            amount=expense.amount,
            paid_by=expense.paid_by,
            group_id=expense.group_id,
            split_type=expense.split_type,
            splits=expense.splits,
            category=expense.category,
            notes=expense.notes,
            created_at=expense.created_at,
            created_by=expense.created_by,
            settled=expense.settled
        )
        for expense in expenses
    ]
    
    return {
        "expenses": expenses_list,
        "total_count": total_count,
        "skip": skip,
        "limit": limit
    }

@router.get("/summary")
async def get_expense_summary(
    group_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Get expense summary with totals (no pagination)"""
    # Treat empty string as None
    if group_id == "":
        group_id = None
        
    if group_id:
        # Get expenses for a specific group
        group = await Group.get(PydanticObjectId(group_id))
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )
        if str(current_user.id) not in group.members:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this group"
            )
        query = {"group_id": group_id}
    else:
        # Get all expenses where user is involved
        user_id = str(current_user.id)
        query = {
            "$or": [
                {"paid_by": user_id},
                {"splits.user_id": user_id}
            ]
        }
    
    # Get all expenses (no pagination)
    all_expenses = await Expense.find(query).to_list()
    
    # Calculate totals excluding settlements
    total_expenses = sum(
        exp.amount for exp in all_expenses 
        if exp.category != 'settlement'
    )
    
    # Calculate user's share excluding settlements
    user_id = str(current_user.id)
    my_expenses = 0
    for exp in all_expenses:
        if exp.category == 'settlement':
            continue
        # Find user's split
        for split in exp.splits:
            if split.get('user_id') == user_id:
                my_expenses += split.get('amount', 0)
                break
    
    return {
        "total_expenses": total_expenses,
        "my_expenses": my_expenses,
        "total_count": len(all_expenses)
    }


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific expense"""
    expense = await Expense.get(PydanticObjectId(expense_id))
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return ExpenseResponse(
        id=str(expense.id),
        description=expense.description,
        amount=expense.amount,
        paid_by=expense.paid_by,
        group_id=expense.group_id,
        split_type=expense.split_type,
        splits=expense.splits,
        category=expense.category,
        notes=expense.notes,
        created_at=expense.created_at,
        created_by=expense.created_by,
        settled=expense.settled
    )

@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an expense"""
    expense = await Expense.get(PydanticObjectId(expense_id))
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Check permissions: group member or involved party
    user_id = str(current_user.id)
    is_involved = (
        expense.paid_by == user_id or
        any(split.get('user_id') == user_id for split in expense.splits)
    )
    
    if expense.group_id:
        # For group expenses, check if user is a group member
        group = await Group.get(PydanticObjectId(expense.group_id))
        if not group or user_id not in group.members:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only group members can delete group expenses"
            )
    elif not is_involved:
        # For individual expenses, check if user is involved
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only involved parties can delete this expense"
        )
    
    # Prevent deleting settlement payments
    if expense.category == 'settlement':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Settlement payments cannot be deleted"
        )
    
    await expense.delete()
    return {"message": "Expense deleted successfully"}

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user)
):
    """Update an expense"""
    expense = await Expense.get(PydanticObjectId(expense_id))
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Check permissions: group member or involved party
    user_id = str(current_user.id)
    is_involved = (
        expense.paid_by == user_id or
        any(split.get('user_id') == user_id for split in expense.splits)
    )
    
    if expense.group_id:
        # For group expenses, check if user is a group member
        group = await Group.get(PydanticObjectId(expense.group_id))
        if not group or user_id not in group.members:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only group members can edit group expenses"
            )
    elif not is_involved:
        # For individual expenses, check if user is involved
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only involved parties can edit this expense"
        )
    
    # Prevent editing settlement payments
    if expense.category == 'settlement':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Settlement payments cannot be edited"
        )
    
    # Add edit history to notes
    from datetime import datetime
    edit_timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    edit_note = f"\n[Edited by {current_user.username} on {edit_timestamp}]"
    
    # Update expense fields
    expense.description = expense_data.description
    expense.amount = expense_data.amount
    expense.category = expense_data.category
    expense.notes = (expense_data.notes or "") + edit_note
    expense.paid_by = expense_data.paid_by
    expense.split_type = expense_data.split_type
    expense.splits = expense_data.splits
    expense.group_id = expense_data.group_id
    
    await expense.save()
    
    return ExpenseResponse(
        id=str(expense.id),
        description=expense.description,
        amount=expense.amount,
        paid_by=expense.paid_by,
        group_id=expense.group_id,
        split_type=expense.split_type,
        splits=expense.splits,
        category=expense.category,
        notes=expense.notes,
        created_at=expense.created_at,
        created_by=expense.created_by,
        settled=expense.settled
    )


@router.get("/balances/summary", response_model=Dict)
async def get_balance_summary(current_user: User = Depends(get_current_user)):
    """Get balance summary for current user with debt simplification"""
    from app.services.debt_simplify import simplify_debts
    
    user_id = str(current_user.id)
    
    # 1. Get all expenses involving the user to find relevant groups
    user_expenses = await Expense.find(
        {"$or": [
            {"paid_by": user_id},
            {"splits.user_id": user_id}
        ]}
    ).to_list()
    
    # Identify groups involved
    group_ids = set(exp.group_id for exp in user_expenses if exp.group_id)
    
    # 2. Calculate balances per group (Group Context)
    all_debts = []
    
    for group_id in group_ids:
        # Fetch group name for context
        group = await Group.get(PydanticObjectId(group_id))
        group_name = group.name if group else "Unknown Group"

        # Fetch ALL expenses for this group to calculate correct net positions
        group_expenses = await Expense.find({"group_id": group_id}).to_list()
        
        # Calculate net balances for all members in this group
        group_member_balances = {}
        for expense in group_expenses:
            # Add to payer
            if expense.paid_by not in group_member_balances:
                group_member_balances[expense.paid_by] = 0.0
            group_member_balances[expense.paid_by] += expense.amount
            
            # Subtract from splitters
            for split in expense.splits:
                split_user_id = split["user_id"]
                if split_user_id not in group_member_balances:
                    group_member_balances[split_user_id] = 0.0
                group_member_balances[split_user_id] -= split["amount"]
        
        # Simplify debts for this group
        simplified_transactions = simplify_debts(group_member_balances)
        
        # Add relevant simplified debts to list
        for trans in simplified_transactions:
            if trans["from"] == user_id:
                # I owe someone
                all_debts.append({
                    "type": "owe",
                    "user_id": trans["to"],
                    "amount": trans["amount"],
                    "group_id": group_id,
                    "group_name": group_name
                })
            elif trans["to"] == user_id:
                # Someone owes me
                all_debts.append({
                    "type": "owed",
                    "user_id": trans["from"],
                    "amount": trans["amount"],
                    "group_id": group_id,
                    "group_name": group_name
                })
                
    # 3. Calculate balances for non-group expenses (Direct Context)
    non_group_expenses = [exp for exp in user_expenses if not exp.group_id]
    
    # For non-group expenses, we can still aggregate per user as they are "direct"
    direct_balances = {}
    
    for expense in non_group_expenses:
        paid_by = expense.paid_by
        for split in expense.splits:
            split_user_id = split["user_id"]
            amount = split["amount"]
            
            if split_user_id == user_id and paid_by != user_id:
                # I owe payer
                if paid_by not in direct_balances:
                    direct_balances[paid_by] = 0.0
                direct_balances[paid_by] -= amount
            elif split_user_id != user_id and paid_by == user_id:
                # Splitter owes me
                if split_user_id not in direct_balances:
                    direct_balances[split_user_id] = 0.0
                direct_balances[split_user_id] += amount
    
    # Add direct debts
    for uid, amount in direct_balances.items():
        if amount < -0.01:
            all_debts.append({
                "type": "owe",
                "user_id": uid,
                "amount": abs(amount),
                "group_id": None,
                "group_name": "Non-group"
            })
        elif amount > 0.01:
            all_debts.append({
                "type": "owed",
                "user_id": uid,
                "amount": amount,
                "group_id": None,
                "group_name": "Non-group"
            })
    
    # Fetch user details for all involved users
    involved_user_ids = set(d["user_id"] for d in all_debts)
    users = await User.find({"_id": {"$in": [PydanticObjectId(uid) for uid in involved_user_ids]}}).to_list()
    user_map = {str(u.id): u.username for u in users}

    # Add usernames to debts
    for debt in all_debts:
        debt["username"] = user_map.get(debt["user_id"], "Unknown User")
    
    total_owed = sum(d["amount"] for d in all_debts if d["type"] == "owe")
    total_owed_to_me = sum(d["amount"] for d in all_debts if d["type"] == "owed")
    
    return {
        "debts": all_debts,
        "total_owed": total_owed,
        "total_owed_to_me": total_owed_to_me
    }
