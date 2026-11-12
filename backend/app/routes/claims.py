from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from ..database import get_db
from app.models.claim import Claim
import uuid
from ..auth import get_current_agent

router = APIRouter(
    prefix="/claims",
    tags=["Claims"]
)

class ClaimCreate(BaseModel):
    # Must match the options in the customer claim form (frontend/app/customer/page.tsx)
    incident_type: Literal["Car Accident", "Hail Damage", "Flood Damage", "Theft", "Vandalism", "Other"]
    incident_date: datetime
    location: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    user_id: str

    @field_validator("incident_date")
    @classmethod
    def incident_date_not_in_future(cls, value: datetime) -> datetime:
        # The form sends the picked day as midnight UTC, so allow up to UTC+14 (the furthest-ahead
        # time zone) to accept "today" for customers anywhere; anything later is a future date
        as_utc = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        if as_utc > datetime.now(timezone.utc) + timedelta(hours=14):
            raise ValueError("Incident date cannot be in the future")
        return value

class ClaimStatusUpdate(BaseModel):
    status: Literal["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"]

@router.get("/")
async def get_claims(db: AsyncSession = Depends(get_db), current_agent: str = Depends(get_current_agent)):
    result = await db.execute(select(Claim).order_by(desc(Claim.created_at)))
    claims = result.scalars().all()
    return {"claims": claims}

@router.get("/{claim_id}")
async def get_claim(claim_id: str, db: AsyncSession = Depends(get_db), current_agent: str = Depends(get_current_agent)):
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return {"claim": claim}

@router.post("/")
async def create_claim(claim: ClaimCreate, db: AsyncSession = Depends(get_db)):
    new_claim = Claim(
        id=str(uuid.uuid4()),
        incident_type=claim.incident_type,
        incident_date=claim.incident_date.replace(tzinfo=None),
        location=claim.location,
        description=claim.description,
        user_id=claim.user_id,
    )
    db.add(new_claim)
    await db.commit()
    await db.refresh(new_claim)
    return {"message": "Claim created successfully", "claim": new_claim}

@router.put("/{claim_id}/status")
async def update_claim_status(claim_id: str, update: ClaimStatusUpdate, db: AsyncSession = Depends(get_db), current_agent: str = Depends(get_current_agent)):
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim.status = update.status
    claim.agent_id = current_agent
    # updated_at is "timestamp without time zone", so store UTC without tzinfo (as with incident_date)
    claim.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()
    await db.refresh(claim)
    return {"message": "Status updated", "claim": claim}