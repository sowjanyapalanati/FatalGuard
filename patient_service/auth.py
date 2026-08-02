import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import bcrypt
from pydantic import BaseModel

from database import get_db

# Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "v2_secure_production_key_4482910x")

ALGORITHM = "HS256"
# Changed from 30 minutes to 7 days to avoid constant re-logins during dev
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Security Utilities
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "doctor"

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None

class TokenRefreshRequest(BaseModel):
    refresh_token: str

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = await db.users.find_one({
        "$or": [
            {"username": form_data.username},
            {"email": form_data.username}
        ]
    })
    
    if not user or not verify_password(form_data.password, user["hashed_pw"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["username"], "role": user.get("role", "doctor")})
    refresh_token = create_refresh_token(data={"sub": user["username"]})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
async def refresh_access_token(body: TokenRefreshRequest):
    try:
        payload = jwt.decode(body.refresh_token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        if username is None or token_type != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Issue new tokens
    access_token = create_access_token(data={"sub": username})
    new_refresh_token = create_refresh_token(data={"sub": username})
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db = Depends(get_db)):
    # Check if user exists
    existing = await db.users.find_one({
        "$or": [
            {"username": user.username},
            {"email": user.email}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "hashed_pw": hashed_password,
        "role": user.role,
        "is_active": True
    }
    
    await db.users.insert_one(user_doc)
    return UserResponse(**user_doc)

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        return {
            "id": "demo-user-id",
            "username": username,
            "email": f"{username}@fetalguard.med",
            "role": payload.get("role", "doctor"),
            "is_active": True
        }
    return user

@router.get("/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    return UserResponse(**current_user)

@router.patch("/me", response_model=UserResponse)
async def update_me(update_data: UserUpdate, current_user = Depends(get_current_user), db = Depends(get_db)):
    update_dict = {}
    if update_data.email:
        update_dict["email"] = update_data.email
    if update_data.password:
        update_dict["hashed_pw"] = get_password_hash(update_data.password)

    if update_dict and db is not None:
        await db.users.update_one(
            {"username": current_user["username"]},
            {"$set": update_dict}
        )
        current_user.update(update_dict)

    return UserResponse(**{k: v for k, v in current_user.items() if k in UserResponse.model_fields})


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    reset_code: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db = Depends(get_db)):
    reset_code = "FG-" + str(uuid.uuid4())[:6].upper()

    if db is None:
        return {
            "message": "If that email is registered, a password reset code has been sent.",
            "reset_code": reset_code
        }

    user = await db.users.find_one({"email": body.email})
    if user:
        await db.users.update_one(
            {"email": body.email},
            {"$set": {
                "reset_code": reset_code,
                "reset_code_created_at": datetime.now(timezone.utc)
            }}
        )

    # Always return the code (in production this would be emailed, never returned)
    return {
        "message": "Password reset verification code generated.",
        "reset_code": reset_code
    }


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db = Depends(get_db)):
    if db is None:
        return {"message": "Password reset successfully. You can now login."}

    user = await db.users.find_one({"email": body.email})
    if not user:
        raise HTTPException(status_code=400, detail="Email address not found.")

    stored_code = user.get("reset_code", "")
    if not stored_code or stored_code != body.reset_code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code. Please request a new one.")

    # Check expiry — code valid for 15 minutes
    created_at = user.get("reset_code_created_at")
    if created_at:
        age = datetime.now(timezone.utc) - created_at.replace(tzinfo=timezone.utc) if created_at.tzinfo is None else datetime.now(timezone.utc) - created_at
        if age.total_seconds() > 900:
            raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    hashed_password = get_password_hash(body.new_password)
    await db.users.update_one(
        {"email": body.email},
        {"$set": {"hashed_pw": hashed_password}, "$unset": {"reset_code": "", "reset_code_created_at": ""}}
    )
    return {"message": "Password reset successfully. You can now login."}
