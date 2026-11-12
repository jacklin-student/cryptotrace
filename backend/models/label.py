from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from backend.database import Base

class Label(Base):
    __tablename__ = "labels"

    address = Column(String, primary_key=True, index=True)
    chain = Column(String, default="BTC", index=True)
    entity_name = Column(String, nullable=False)
    category = Column(String, default="UNLABELED")   # EXCHANGE, SANCTIONED_OFAC, MIXER, SCAM_PHISHING, DEFI_BRIDGE, UNLABELED
    risk_level = Column(String, default="LOW")       # LOW, MEDIUM, HIGH
    source_name = Column(String, default="CryptoTrace Intelligence")
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    metadata_json = Column(Text, nullable=True)
