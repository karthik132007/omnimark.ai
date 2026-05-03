import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from pydantic import BaseModel, EmailStr

from backend.db import db

from bson.objectid import ObjectId

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Models
class UnivRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    email: EmailStr
    password: str

# Routes
@router.post("/auth/univ/register", summary="Register a University", tags=["Auth"])
def register_university(univ: UnivRegister):
    if db.users.find_one({"email": univ.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = univ.model_dump()
    user_dict["password"] = get_password_hash(univ.password)
    user_dict["role"] = "university"
    
    db.users.insert_one(user_dict)
    return {"msg": "University registered successfully"}

@router.post("/auth/login", summary="Login for Univ/Teacher", tags=["Auth"])
def login(login_data: LoginModel):
    user = db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"], "id": str(user["_id"])}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: str = payload.get("id")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "role": role, "id": user_id}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_univ(user: dict = Depends(get_current_user)):
    if user["role"] != "university":
        raise HTTPException(status_code=403, detail="Only university can access this")
    return user

@router.post("/univ/teachers", summary="University adds a Teacher", tags=["University"])
def add_teacher(teacher: TeacherCreate, current_univ: dict = Depends(get_current_univ)):
    if db.users.find_one({"email": teacher.email}):
        raise HTTPException(status_code=400, detail="Teacher email already registered")
    
    teacher_dict = teacher.model_dump()
    teacher_dict["password"] = get_password_hash(teacher.password)
    teacher_dict["role"] = "teacher"
    teacher_dict["university_id"] = current_univ["id"]
    
    result = db.users.insert_one(teacher_dict)
    return {"msg": "Teacher added successfully", "id": str(result.inserted_id)}

@router.get("/univ/teachers", summary="Get all teachers for a university", tags=["University"])
def get_teachers(current_univ: dict = Depends(get_current_univ)):
    teachers = db.users.find({"role": "teacher", "university_id": current_univ["id"]}, {"password": 0})
    result = []
    for t in teachers:
        t["_id"] = str(t["_id"])
        result.append(t)
    return result

@router.delete("/univ/teachers/{teacher_id}", summary="Delete a teacher", tags=["University"])
def delete_teacher(teacher_id: str, current_univ: dict = Depends(get_current_univ)):
    res = db.users.delete_one({"_id": ObjectId(teacher_id), "university_id": current_univ["id"], "role": "teacher"})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"msg": "Teacher deleted successfully"}

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None

@router.put("/univ/teachers/{teacher_id}", summary="Edit a teacher", tags=["University"])
def update_teacher(teacher_id: str, updates: TeacherUpdate, current_univ: dict = Depends(get_current_univ)):
    update_data = {}
    if updates.name:
        update_data["name"] = updates.name
    if updates.password:
        update_data["password"] = get_password_hash(updates.password)
        
    if not update_data:
        return {"msg": "Nothing to update"}

    res = db.users.update_one(
        {"_id": ObjectId(teacher_id), "university_id": current_univ["id"], "role": "teacher"},
        {"$set": update_data}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"msg": "Teacher updated successfully"}

@router.get("/teachers/me", summary="Teacher Dashboard Info", tags=["Teacher"])
def teacher_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access this (univ cannot do teacher stuff)")
    return {"msg": "Welcome to teacher dashboard", "teacher_data": current_user}
