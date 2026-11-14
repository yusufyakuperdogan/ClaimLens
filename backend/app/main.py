import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .routes.claims import router as claims_router
from .routes.damage import router as damage_router
from .routes.auth_api import router as auth_router, limiter

load_dotenv()

# Hide the API documentation (/docs, /redoc, /openapi.json) when ENVIRONMENT=production
IS_PRODUCTION = os.getenv("ENVIRONMENT", "").strip().lower() == "production"

app = FastAPI(
    title="ClaimLens API",
    description="AI-powered insurance claims processing",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

# Rate limiting (used by POST /auth/login); exceeding a limit returns 429
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://claim-lens-one.vercel.app"],
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(claims_router)
app.include_router(damage_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "ClaimLens API is running"}