import asyncio
from supabase import create_client
from ..env import require_env

supabase = create_client(
    require_env("SUPABASE_URL"),
    require_env("SUPABASE_SERVICE_KEY")
)

async def delete_claim_photos(claim_id: str) -> None:
    bucket = supabase.storage.from_("claim-photos")
    files = await asyncio.to_thread(bucket.list, claim_id)
    paths = [f"{claim_id}/{file['name']}" for file in files]
    if paths:
        await asyncio.to_thread(bucket.remove, paths)

async def upload_photo(image_bytes: bytes, claim_id: str, file_index: int, mime_type: str) -> str:
    extension = mime_type.split("/")[-1]
    file_path = f"{claim_id}/photo_{file_index}.{extension}"
    
    await asyncio.to_thread(
        supabase.storage.from_("claim-photos").upload,
        path=file_path,
        file=image_bytes,
        file_options={"content-type": mime_type, "upsert": "true"}
    )
    
    return file_path