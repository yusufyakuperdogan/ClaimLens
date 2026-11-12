from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..database import get_db
from ..models.claim import Claim, DamageReport
from ..services.ai_service import analyze_damage, DamageAnalysisError
from ..services.storage_service import upload_photo, delete_claim_photos
from ..auth import get_current_agent
from google.api_core.exceptions import GoogleAPIError
from google.auth.exceptions import GoogleAuthError
from storage3.exceptions import StorageException
import asyncio
import httpx
import json
import logging
import uuid

logger = logging.getLogger(__name__)

# Errors from Supabase Storage: API errors, network/timeout errors that storage3 doesn't wrap, and the
# JSONDecodeError storage3 raises when an error response isn't JSON (e.g. a proxy's HTML outage page)
STORAGE_ERRORS = (StorageException, httpx.HTTPError, json.JSONDecodeError)
# Errors from the Gemini API: quota, timeouts, outages, bad requests, and invalid/missing API key
GEMINI_ERRORS = (GoogleAPIError, GoogleAuthError)

router = APIRouter(
    prefix="/damage",
    tags=["Damage Analysis"]
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
HEIC_BRANDS = {b"heic", b"heix", b"heim", b"heis", b"hevc", b"hevx", b"hevm", b"hevs"}


def detect_image_type(header: bytes) -> str | None:
    """Identify the image format from the file's leading bytes instead of the client's content type."""
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "image/webp"
    if header[4:8] == b"ftyp":
        # HEIC is an ISO media file: check the major brand and the compatible brands in the ftyp box
        box_end = min(int.from_bytes(header[:4], "big"), len(header))
        brands = [header[8:12]] + [header[i:i + 4] for i in range(16, box_end - 3, 4)]
        if any(brand in HEIC_BRANDS for brand in brands):
            return "image/heic"
    return None

@router.get("/report/{claim_id}")
async def get_damage_report(claim_id: str, db: AsyncSession = Depends(get_db), current_agent: str = Depends(get_current_agent)):
    result = await db.execute(
        select(DamageReport).where(DamageReport.claim_id == claim_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Damage report not found")
    return {"damage_report": report}

@router.get("/photos/{claim_id}")
async def get_claim_photos(claim_id: str, current_agent: str = Depends(get_current_agent)):
    from ..services.storage_service import supabase
    try:
        files = await asyncio.to_thread(supabase.storage.from_("claim-photos").list, claim_id)
        urls = []
        for file in files:
            signed = await asyncio.to_thread(
                supabase.storage.from_("claim-photos").create_signed_url,
                f"{claim_id}/{file['name']}", 3600
            )
            urls.append(signed['signedURL'])
        return {"photos": urls}
    except Exception as e:
        return {"photos": []}


@router.post("/analyze/{claim_id}")
async def analyze_claim_damage(
    claim_id: str,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    if len(files) < 1:
        raise HTTPException(status_code=400, detail="At least 1 photo is required")
    
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 photos allowed")

    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    existing_report = await db.execute(
        select(DamageReport).where(DamageReport.claim_id == claim_id)
    )
    if existing_report.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Damage report already exists for this claim")

    # Validate every file before touching storage, so a bad file can't leave a partial upload
    images = []
    for i, file in enumerate(files):
        name = file.filename or f"Photo {i + 1}"
        image_bytes = await file.read(MAX_FILE_SIZE + 1)
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"'{name}' is larger than 10 MB. Please upload a smaller photo.")
        if not image_bytes:
            raise HTTPException(status_code=400, detail=f"'{name}' is empty. Please upload a valid photo.")
        mime_type = detect_image_type(image_bytes[:64])
        if mime_type is None:
            raise HTTPException(
                status_code=400,
                detail=f"'{name}' is not a supported image. Please upload JPG, PNG, WEBP or HEIC photos.",
            )
        images.append((image_bytes, mime_type))

    try:
        # Clear photos left over from a previous failed attempt
        await delete_claim_photos(claim_id)

        for i, (image_bytes, mime_type) in enumerate(images):
            await upload_photo(image_bytes, claim_id, i, mime_type)
    except STORAGE_ERRORS:
        logger.exception("Photo storage failed for claim %s", claim_id)
        raise HTTPException(status_code=502, detail="Photo storage service is unavailable. Please try again.")

    try:
        ai_result = await analyze_damage(images)
    except DamageAnalysisError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except GEMINI_ERRORS:
        logger.exception("Gemini analysis failed for claim %s", claim_id)
        raise HTTPException(status_code=502, detail="AI analysis service is unavailable. Please try again.")

    damage_report = DamageReport(
        id=str(uuid.uuid4()),
        claim_id=claim_id,
        damage_type=ai_result["damage_type"],
        vehicle_make=ai_result.get("vehicle_make", "Unknown"),
        vehicle_model=ai_result.get("vehicle_model", "Unknown"),
        vehicle_color=ai_result.get("vehicle_color", "Unknown"),
        severity=ai_result["severity"],
        estimated_cost_min=ai_result["estimated_cost_min"],
        estimated_cost_max=ai_result["estimated_cost_max"],
        confidence_score=ai_result["confidence_score"],
        ai_summary=ai_result["ai_summary"],
    )

    db.add(damage_report)
    await db.commit()
    await db.refresh(damage_report)

    return {
        "message": "Damage analysis complete",
        "photos_analyzed": len(files),
        "damage_report": damage_report
    }