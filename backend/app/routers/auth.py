from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..auth_utils import create_access_token, get_password_hash, verify_password
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(data.password)
    new_user = User(email=data.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    return {"message": "registered"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
