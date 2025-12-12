"""
Authentication helper functions for Emergent Auth integration and Email/Password auth
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
import httpx
import os
import secrets
from fastapi import HTTPException, Request, Cookie
from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext
from jose import JWTError, jwt

EMERGENT_AUTH_API = os.getenv("EMERGENT_AUTH_API", "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data")
SESSION_EXPIRY_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


# Password Hashing Functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


# JWT Token Functions
def create_access_token(email: str) -> str:
    """Create a JWT access token"""
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    
    to_encode = {
        "sub": email,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        return email
    except JWTError:
        return None


async def fetch_session_data(session_id: str) -> Dict:
    """
    Fetch user data from Emergent Auth using session_id
    
    Args:
        session_id: Temporary session ID from URL fragment
        
    Returns:
        Dict with user data: {id, email, name, picture, session_token}
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                EMERGENT_AUTH_API,
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid session ID"
                )
            
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch session data: {str(e)}"
            )


async def create_or_update_session(
    db: AsyncIOMotorDatabase,
    user_email: str,
    user_data: Dict,
    session_token: str
) -> Dict:
    """
    Create or update user and session in database
    
    Args:
        db: MongoDB database instance
        user_email: User's email address
        user_data: User data from Emergent Auth
        session_token: Session token from Emergent Auth
        
    Returns:
        User document from database
    """
    users_collection = db.users
    sessions_collection = db.sessions
    
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user_email}, {"_id": 0})
    
    if not existing_user:
        # Create new user
        user_doc = {
            "id": user_data.get("id"),
            "email": user_email,
            "name": user_data.get("name", ""),
            "picture": user_data.get("picture", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "subscription_tier": "free"
        }
        await users_collection.insert_one(user_doc)
        user = user_doc
    else:
        user = existing_user
    
    # Create or update session
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)
    
    session_doc = {
        "session_token": session_token,
        "user_email": user_email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat()
    }
    
    await sessions_collection.update_one(
        {"session_token": session_token},
        {"$set": session_doc},
        upsert=True
    )
    
    return user


async def get_session_token(request: Request) -> Optional[str]:
    """
    Extract session token from cookies or Authorization header
    
    Args:
        request: FastAPI request object
        
    Returns:
        Session token string or None
    """
    # Try cookie first (preferred)
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        # Try Authorization header as fallback
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    return session_token


async def verify_session(
    db: AsyncIOMotorDatabase,
    session_token: str
) -> Optional[Dict]:
    """
    Verify session token and return user data
    
    Args:
        db: MongoDB database instance
        session_token: Session token to verify
        
    Returns:
        User document if valid, None otherwise
    """
    sessions_collection = db.sessions
    users_collection = db.users
    
    # Find session
    session = await sessions_collection.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check if session expired
    expires_at = datetime.fromisoformat(session["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        # Delete expired session
        await sessions_collection.delete_one({"session_token": session_token})
        return None
    
    # Get user data
    user = await users_collection.find_one(
        {"email": session["user_email"]},
        {"_id": 0}
    )
    
    return user


async def delete_session(
    db: AsyncIOMotorDatabase,
    session_token: str
) -> bool:
    """
    Delete a session from database
    
    Args:
        db: MongoDB database instance
        session_token: Session token to delete
        
    Returns:
        True if deleted, False otherwise
    """
    sessions_collection = db.sessions
    result = await sessions_collection.delete_one({"session_token": session_token})
    return result.deleted_count > 0
