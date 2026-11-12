import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

class Settings:
    PROJECT_NAME: str = "CryptoTrace"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Theme configuration (Strict palette requirements)
    THEME_COLORS = {
        "background": "#FFFFFF",
        "primary_skin": "#F2CCB7",
        "accent_skin": "#D9A98E",
        "soft_skin_tint": "#FBEFE7",
        "text_dark": "#3B2A22",
        "text_muted": "#7A6257",
        "risk_high": "#C0392B",
        "risk_medium": "#E0A030",
        "risk_low": "#3E9B6B"
    }

    # API Keys
    ETHERSCAN_API_KEY: str = os.getenv("ETHERSCAN_API_KEY", "")
    BLOCKSTREAM_API_URL: str = os.getenv("BLOCKSTREAM_API_URL", "https://blockstream.info/api")
    ETHERSCAN_API_URL: str = os.getenv("ETHERSCAN_API_URL", "https://api.etherscan.io/v2/api")

    # Cache TTL (hours)
    CACHE_EXPIRY_HOURS: int = int(os.getenv("CACHE_EXPIRY_HOURS", "24"))

    # Graph Tracing Limits
    DEFAULT_MAX_NODES: int = int(os.getenv("MAX_NODES", "100"))
    DEFAULT_MAX_EDGES: int = int(os.getenv("MAX_EDGES", "250"))

settings = Settings()
