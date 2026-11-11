import os
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from ..auth import verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


def client_ip(request: Request) -> str:
    # Railway's edge sets X-Real-IP to the visitor's IP (clients can't override it).
    # Without a proxy (local development) fall back to the direct connection address.
    return request.headers.get("x-real-ip") or get_remote_address(request)


limiter = Limiter(key_func=client_ip)


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    correct_username = os.getenv("AGENT_USERNAME")
    correct_password_hash = os.getenv("AGENT_PASSWORD_HASH")

    if credentials.username != correct_username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not verify_password(credentials.password, correct_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(data={"sub": credentials.username})
    return {"access_token": access_token, "token_type": "bearer"}