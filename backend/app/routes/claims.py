from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, ConfigDict, Field, field_validator
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

# Response schemas: what clients receive. Internal fields (user_id, priority_score, fraud_flag) are left out.
# Optional fields mirror the nullable columns on the Claim model.
class ClaimOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: Optional[str] = None
    incident_type: str
    incident_date: datetime
    location: str
    description: Optional[str] = None
    agent_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ClaimListResponse(BaseModel):
    claims: list[ClaimOut]

class ClaimResponse(BaseModel):
    claim: ClaimOut

class ClaimMessageResponse(BaseModel):
    message: str
    claim: ClaimOut

@router.get("/", response_model=ClaimListResponse)
async def get_claims(db: AsyncSession = Depends(get_db), current_agent: str = Depends(get_current_agent)):
    result = await db.execute(select(Claim).order_by(desc(Claim.created_at)))
    claims = result.scalars().all()
    return {"claims": claims}

@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(claim_id: str, db: AsyncSession = Depends(get_db), current_agent: str = Depends(get_current_agent)):
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return {"claim": claim}

@router.post("/", response_model=ClaimMessageResponse)
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

@router.put("/{claim_id}/status", response_model=ClaimMessageResponse)
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