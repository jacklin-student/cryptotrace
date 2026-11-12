from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=True)
    target_address = Column(String, index=True, nullable=False)
    target_type = Column(String, default="address")  # "address" or "tx_hash"
    target_chain = Column(String, default="BTC")     # "BTC" or "ETH"
    depth = Column(Integer, default=3)               # 3, 5, 10
    max_nodes = Column(Integer, default=100)
    max_edges = Column(Integer, default=250)
    status = Column(String, default="PENDING")       # PENDING, RUNNING, COMPLETED, FAILED, TRUNCATED
    is_truncated = Column(Boolean, default=False)
    data_mode = Column(String, default="DEMO")       # "DEMO" or "ON-CHAIN"
    root_tx_hash = Column(String, nullable=True)
    summary_json = Column(Text, nullable=True)       # JSON string storing stats, metrics
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    edges = relationship("Edge", back_populates="investigation", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="investigation", cascade="all, delete-orphan")
