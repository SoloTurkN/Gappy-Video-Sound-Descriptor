"""
FastAPI dependencies for authentication
"""
from fastapi import Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from auth_helpers import get_session_token, verify_session


async def get_db(request: Request) -> AsyncIOMotorDatabase:
    """Get database instance from app state"""
    return request.app.state.db


async def get_current_user(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Dict:
    """
    Dependency to get current authenticated user
    
    Use this in route handlers to protect endpoints:
    @router.get("/protected")
    async def protected_route(user: Dict = Depends(get_current_user)):
        return {"message": f"Hello {user['name']}"}
    """
    session_token = await get_session_token(request)
    
    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please log in."
        )
    
    user = await verify_session(db, session_token)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session. Please log in again."
        )
    
    return user
