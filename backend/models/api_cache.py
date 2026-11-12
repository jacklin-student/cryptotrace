from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from backend.database import Base

class ApiCache(Base):
    __tablename__ = "api_cache"

    cache_key = Column(String, primary_key=True, index=True)
    chain = Column(String, default="BTC", index=True)
    endpoint = Column(String, nullable=False)
    query_param = Column(String, nullable=False)
    response_json = Column(Text, nullable=False)
    sha256_checksum = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
