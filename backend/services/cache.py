import hashlib
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.models.api_cache import ApiCache
from backend.config import settings

logger = logging.getLogger("cryptotrace.cache")

def compute_cache_key(endpoint: str, params: Dict[str, Any]) -> str:
    """Generates a reproducible SHA-256 cache key from endpoint and sorted parameters."""
    normalized = f"{endpoint}:{json.dumps(params, sort_keys=True)}"
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

def compute_payload_checksum(payload_str: str) -> str:
    """Computes SHA-256 checksum for response tamper verification."""
    return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()

class CacheService:
    @staticmethod
    def get(db: Session, endpoint: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        cache_key = compute_cache_key(endpoint, params)
        entry = db.query(ApiCache).filter(ApiCache.cache_key == cache_key).first()

        if not entry:
            return None

        # Check expiration
        now = datetime.now(timezone.utc)
        entry_exp = entry.expires_at
        if entry_exp.tzinfo is None:
            entry_exp = entry_exp.replace(tzinfo=timezone.utc)

        if now > entry_exp:
            logger.info(f"Cache key {cache_key} expired; evicting.")
            db.delete(entry)
            db.commit()
            return None

        # Verify integrity against stored checksum
        computed_hash = compute_payload_checksum(entry.response_json)
        if computed_hash != entry.sha256_checksum:
            logger.warning(f"Cache tamper detected on key {cache_key}! Checksum mismatch.")
            db.delete(entry)
            db.commit()
            return None

        try:
            return json.loads(entry.response_json)
        except Exception as e:
            logger.error(f"Failed to decode cached json for {cache_key}: {e}")
            return None

    @staticmethod
    def set(
        db: Session,
        chain: str,
        endpoint: str,
        params: Dict[str, Any],
        response_data: Dict[str, Any],
        ttl_hours: Optional[int] = None
    ) -> None:
        cache_key = compute_cache_key(endpoint, params)
        payload_str = json.dumps(response_data)
        checksum = compute_payload_checksum(payload_str)

        ttl = ttl_hours if ttl_hours is not None else settings.CACHE_EXPIRY_HOURS
        expires_at = datetime.now(timezone.utc) + timedelta(hours=ttl)

        existing = db.query(ApiCache).filter(ApiCache.cache_key == cache_key).first()
        if existing:
            existing.response_json = payload_str
            existing.sha256_checksum = checksum
            existing.expires_at = expires_at
        else:
            new_entry = ApiCache(
                cache_key=cache_key,
                chain=chain,
                endpoint=endpoint,
                query_param=json.dumps(params),
                response_json=payload_str,
                sha256_checksum=checksum,
                expires_at=expires_at
            )
            db.add(new_entry)

        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error persisting cache key {cache_key}: {e}")
