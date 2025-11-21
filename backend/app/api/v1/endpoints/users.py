from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.user import UserResponse
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from beanie import PydanticObjectId

router = APIRouter()

@router.get("/search", response_model=List[UserResponse])
async def search_users(
    query: str,
    current_user: User = Depends(get_current_user)
):
    """Search users by username or email"""
    users = await User.find(
        {"$or": [
            {"username": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}}
        ]},
        {"_id": {"$ne": current_user.id}}
    ).limit(10).to_list()
    
    return [
        UserResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            created_at=user.created_at
        )
        for user in users
    ]

@router.post("/friends/{user_id}", status_code=status.HTTP_200_OK)
async def add_friend(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Add a friend"""
    if user_id == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add yourself as friend"
        )
    
    friend = await User.get(PydanticObjectId(user_id))
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user_id not in current_user.friends:
        current_user.friends.append(user_id)
        await current_user.save()
    
    # Add reverse friendship
    if str(current_user.id) not in friend.friends:
        friend.friends.append(str(current_user.id))
        await friend.save()
    
    return {"message": "Friend added successfully"}

@router.get("/friends", response_model=List[UserResponse])
async def get_friends(current_user: User = Depends(get_current_user)):
    """Get all friends"""
    friend_users = []
    for friend_id in current_user.friends:
        friend = await User.get(PydanticObjectId(friend_id))
        if friend:
            friend_users.append(
                UserResponse(
                    id=str(friend.id),
                    email=friend.email,
                    username=friend.username,
                    full_name=friend.full_name,
                    avatar_url=friend.avatar_url,
                    created_at=friend.created_at
                )
            )
    return friend_users

@router.delete("/friends/{user_id}", status_code=status.HTTP_200_OK)
async def remove_friend(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove a friend"""
    if user_id in current_user.friends:
        current_user.friends.remove(user_id)
        await current_user.save()
    
    # Remove reverse friendship
    friend = await User.get(PydanticObjectId(user_id))
    if friend and str(current_user.id) in friend.friends:
        friend.friends.remove(str(current_user.id))
        await friend.save()
    
    return {"message": "Friend removed successfully"}
