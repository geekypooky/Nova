from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from nova.orchestrator.db import users_collection
from bson import ObjectId

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthRequest(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(request: AuthRequest):
    if not request.username or not request.password:
        raise HTTPException(status_code=400, detail="Username and password required")
        
    existing_user = users_collection.find_one({"username": request.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    hashed_password = pwd_context.hash(request.password)
    
    new_user = {
        "username": request.username,
        "password": hashed_password,
        "emergency_contact_name": "",
        "emergency_contact_number": "",
        "twilio_sid": "",
        "twilio_token": ""
    }
    
    result = users_collection.insert_one(new_user)
    
    return {
        "status": "success", 
        "user_id": str(result.inserted_id),
        "username": request.username
    }

@router.post("/login")
async def login(request: AuthRequest):
    user = users_collection.find_one({"username": request.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    if not pwd_context.verify(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    return {
        "status": "success",
        "user_id": str(user["_id"]),
        "username": user["username"]
    }
