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
    delete_session,
    hash_password,
    verify_password,
    create_access_token
)
from datetime import datetime, timezone, timedelta
from pydantic import EmailStr, Field, field_validator
import uuid

router = APIRouter(prefix="/api/auth", tags=["authentication"])


class SessionRequest(BaseModel):
    session_id: str


class EmailSignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        return v


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str


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


@router.post("/signup/email")
async def signup_with_email(
    signup_data: EmailSignupRequest,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Sign up with email and password
    
    Creates a new user account with email/password authentication
    """
    try:
        users_collection = db.users
        sessions_collection = db.sessions
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": signup_data.email}, {"_id": 0})
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email already registered. Please login instead."
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = hash_password(signup_data.password)
        
        user_doc = {
            "id": user_id,
            "email": signup_data.email,
            "name": signup_data.name,
            "picture": "",
            "password_hash": hashed_password,
            "auth_method": "email",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "subscription_tier": "free"
        }
        
        await users_collection.insert_one(user_doc)
        
        # Create JWT session token
        session_token = create_access_token(signup_data.email)
        
        # Store session in database
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session_doc = {
            "session_token": session_token,
            "user_email": signup_data.email,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at.isoformat()
        }
        await sessions_collection.insert_one(session_doc)
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        
        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": signup_data.email,
                "name": signup_data.name,
                "picture": "",
                "subscription_tier": "free"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Signup failed: {str(e)}"
        )


@router.post("/login/email")
async def login_with_email(
    login_data: EmailLoginRequest,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Login with email and password
    
    Authenticates user and creates a session
    """
    try:
        users_collection = db.users
        sessions_collection = db.sessions
        
        # Find user by email
        user = await users_collection.find_one({"email": login_data.email}, {"_id": 0})
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Check if user has a password (email auth)
        if "password_hash" not in user:
            raise HTTPException(
                status_code=401,
                detail="This account uses Google sign-in. Please use 'Sign in with Google' button."
            )
        
        # Verify password
        if not verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Create JWT session token
        session_token = create_access_token(login_data.email)
        
        # Store session in database
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session_doc = {
            "session_token": session_token,
            "user_email": login_data.email,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at.isoformat()
        }
        await sessions_collection.update_one(
            {"session_token": session_token},
            {"$set": session_doc},
            upsert=True
        )
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        
        return {
            "success": True,
            "user": {
                "id": user.get("id", ""),
                "email": user["email"],
                "name": user.get("name", ""),
                "picture": user.get("picture", ""),
                "subscription_tier": user.get("subscription_tier", "free")
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
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
