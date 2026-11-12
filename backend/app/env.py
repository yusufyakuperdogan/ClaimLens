import os
from dotenv import load_dotenv

# Load backend/.env here so required variables are available no matter which module is imported first
load_dotenv()


def require_env(name: str) -> str:
    """Return a required environment variable, or stop the app at startup if it's missing or empty."""
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            f"Set it in backend/.env (local) or in the hosting environment's variables (Railway)."
        )
    return value
