"""
Authentication routes for Emergent Auth integration
"""
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import sys
import os

# Add parent directory to path to import auth_helpers
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth_helpers import (
    fetch_session_data,
    create_or_update_session,
    get_session_token,
    verify_session,
    delete_session
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


class SessionRequest(BaseModel):
    session_id: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str
    subscription_tier: str


async def get_db(request: Request) -> AsyncIOMotorDatabase:
    """Dependency to get database instance from app state"""
    return request.app.state.db


@router.post("/session")
async def process_session(
    session_request: SessionRequest,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Process session_id from Emergent Auth and create user session
    
    This endpoint:
    1. Exchanges session_id for user data and session_token
    2. Creates or updates user in database
    3. Stores session in database
    4. Sets httpOnly cookie with session_token
    
    Returns user data
    """
    try:
        # Fetch user data from Emergent Auth
        auth_data = await fetch_session_data(session_request.session_id)
        
        # Create or update user and session
        user = await create_or_update_session(
            db=db,
            user_email=auth_data["email"],
            user_data=auth_data,
            session_token=auth_data["session_token"]
        )
        
        # Set httpOnly cookie with session token
        response.set_cookie(
            key="session_token",
            value=auth_data["session_token"],
            httponly=True,
            secure=True,  # HTTPS only in production
            samesite="none",  # Required for cross-site cookies
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        
        return {
            "success": True,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "picture": user["picture"],
                "subscription_tier": user.get("subscription_tier", "free")
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process session: {str(e)}"
        )


@router.get("/me")
async def get_current_user(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get current authenticated user data
    
    Requires valid session_token in cookie or Authorization header
    """
    session_token = await get_session_token(request)
    
    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    
    user = await verify_session(db, session_token)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )
    
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture", ""),
        "subscription_tier": user.get("subscription_tier", "free")
    }


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Logout current user
    
    Deletes session from database and clears cookie
    """
    session_token = await get_session_token(request)
    
    if session_token:
        # Delete session from database
        await delete_session(db, session_token)
    
    # Clear cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        samesite="none",
        secure=True
    )
    
    return {"success": True, "message": "Logged out successfully"}


@router.get("/check")
async def check_auth(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Check if user is authenticated
    
    Returns user data if authenticated, or authentication status
    """
    session_token = await get_session_token(request)
    
    if not session_token:
        return {
            "authenticated": False,
            "user": None
        }
    
    user = await verify_session(db, session_token)
    
    if not user:
        return {
            "authenticated": False,
            "user": None
        }
    
    return {
        "authenticated": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "picture": user.get("picture", ""),
            "subscription_tier": user.get("subscription_tier", "free")
        }
    }
