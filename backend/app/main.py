from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .routes.claims import router as claims_router
from .routes.damage import router as damage_router
from .routes.auth_api import router as auth_router, limiter

load_dotenv()

app = FastAPI(
    title="ClaimLens API",
    description="AI-powered insurance claims processing",
    version="1.0.0",
)

# Rate limiting (used by POST /auth/login); exceeding a limit returns 429
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://claim-lens-one.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(claims_router)
app.include_router(damage_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "ClaimLens API is running"}