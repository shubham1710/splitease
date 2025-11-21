from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.group import GroupCreate, GroupResponse, GroupUpdate, AddMemberRequest
from app.models.group import Group
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from beanie import PydanticObjectId

router = APIRouter()

@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new group"""
    # Ensure current user is in members
    members = list(set(group_data.members + [str(current_user.id)]))
    
    group = Group(
        name=group_data.name,
        description=group_data.description,
        members=members,
        created_by=str(current_user.id)
    )
    await group.insert()
    
    return GroupResponse(
        id=str(group.id),
        name=group.name,
        description=group.description,
        members=group.members,
        created_by=group.created_by,
        created_at=group.created_at,
        image_url=group.image_url
    )

@router.get("/", response_model=List[GroupResponse])
async def get_groups(current_user: User = Depends(get_current_user)):
    """Get all groups where user is a member"""
    groups = await Group.find(
        {"members": {"$in": [str(current_user.id)]}}
    ).to_list()
    
    # Fetch all unique member IDs
    all_member_ids = set()
    for group in groups:
        all_member_ids.update(group.members)
    
    # Fetch user details for all members
    users = await User.find({"_id": {"$in": [PydanticObjectId(mid) for mid in all_member_ids]}}).to_list()
    user_map = {str(u.id): {"id": str(u.id), "username": u.username, "email": u.email} for u in users}
    
    return [
        GroupResponse(
            id=str(group.id),
            name=group.name,
            description=group.description,
            members=group.members,
            member_details=[user_map.get(mid, {"id": mid, "username": "User"}) for mid in group.members],
            created_by=group.created_by,
            created_at=group.created_at,
            image_url=group.image_url
        )
        for group in groups
    ]

@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific group"""
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
    
    return GroupResponse(
        id=str(group.id),
        name=group.name,
        description=group.description,
        members=group.members,
        created_by=group.created_by,
        created_at=group.created_at,
        image_url=group.image_url
    )

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    group_data: GroupUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a group"""
    group = await Group.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    if group.created_by != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group creator can update the group"
        )
    
    if group_data.name is not None:
        group.name = group_data.name
    if group_data.description is not None:
        group.description = group_data.description
    if group_data.image_url is not None:
        group.image_url = group_data.image_url
    
    await group.save()
    
    return GroupResponse(
        id=str(group.id),
        name=group.name,
        description=group.description,
        members=group.members,
        created_by=group.created_by,
        created_at=group.created_at,
        image_url=group.image_url
    )

@router.post("/{group_id}/members", status_code=status.HTTP_200_OK)
async def add_member(
    group_id: str,
    member_data: AddMemberRequest,
    current_user: User = Depends(get_current_user)
):
    """Add a member to the group"""
    group = await Group.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    if str(current_user.id) not in group.members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group members can add new members"
        )
    
    # Verify user exists
    user = await User.get(PydanticObjectId(member_data.user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if member_data.user_id not in group.members:
        group.members.append(member_data.user_id)
        await group.save()
    
    return {"message": "Member added successfully"}

@router.delete("/{group_id}", status_code=status.HTTP_200_OK)
async def delete_group(
    group_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a group"""
    group = await Group.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    if group.created_by != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group creator can delete the group"
        )
    
    await group.delete()
    return {"message": "Group deleted successfully"}

@router.get("/{group_id}/balances")
async def get_group_balances(
    group_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get balances and settlement suggestions for a group"""
    from app.models.expense import Expense
    
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
        
    # Get all expenses for the group
    expenses = await Expense.find({"group_id": group_id}).to_list()
    
    # Calculate net balances
    # Positive means user is owed money, Negative means user owes money
    balances = {member_id: 0.0 for member_id in group.members}
    
    for expense in expenses:
        # Add amount to payer
        if expense.paid_by in balances:
            balances[expense.paid_by] += expense.amount
            
        # Subtract amount from splitters
        for split in expense.splits:
            if split["user_id"] in balances:
                balances[split["user_id"]] -= split["amount"]
                
    # Generate settlement suggestions using service
    from app.services.debt_simplify import simplify_debts
    settlements = simplify_debts(balances)
            
    return {
        "balances": balances,
        "settlements": settlements
    }
