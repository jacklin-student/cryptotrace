from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class InvestigationCreate(BaseModel):
    target: str = Field(..., description="BTC or ETH address, or transaction hash")
    depth: int = Field(3, description="Hop depth: 3, 5, or 10")
    data_mode: str = Field("DEMO", description="'DEMO' or 'ON-CHAIN'")
    max_nodes: int = Field(100, description="Max graph nodes before truncation")
    max_edges: int = Field(250, description="Max graph edges before truncation")

class NodeData(BaseModel):
    id: str
    label: str
    chain: str
    risk_score: float = 0.0
    risk_level: str = "LOW"
    confidence_score: float = 0.0
    is_probable_end_receiver: bool = False
    rank: Optional[int] = None
    cluster_id: Optional[str] = None
    entity_label: Optional[str] = None
    balance: float = 0.0
    heuristic_tags: List[str] = []
    threat_tags: List[str] = []
    reasoning: Optional[str] = None

class EdgeData(BaseModel):
    id: str
    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    tx_hash: str
    amount: float
    hop_number: int
    chain: str
    heuristic_tags: List[str] = []
    is_adversarial: bool = False
    edge_type: str = "TRANSFER"
    timestamp: Optional[datetime] = None

    class Config:
        populate_by_name = True

class AlertData(BaseModel):
    id: Optional[int] = None
    threat_type: str
    severity: str
    title: str
    description: str
    affected_wallets: List[str] = []
    affected_txs: List[str] = []
    evidence: Dict[str, Any] = {}
    created_at: Optional[datetime] = None

class GraphData(BaseModel):
    nodes: List[NodeData]
    edges: List[EdgeData]

class TraceResponse(BaseModel):
    investigation_id: str
    title: Optional[str] = None
    target_address: str
    target_type: str
    target_chain: str
    depth: int
    status: str
    is_truncated: bool = False
    data_mode: str
    graph: GraphData
    probable_end_receivers: List[NodeData]
    alerts: List[AlertData]
    stats: Dict[str, Any]
    timeline: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

class AuditLogEntry(BaseModel):
    id: int
    investigation_id: str
    entry_index: int
    action: str
    actor: str
    prev_hash: str
    current_hash: str
    timestamp: datetime
    payload: Dict[str, Any]

class AuditVerifyResponse(BaseModel):
    is_valid: bool
    total_entries: int
    broken_at_index: Optional[int] = None
    broken_entry_id: Optional[int] = None
    message: str
    chain_details: List[Dict[str, Any]] = []

class DashboardStats(BaseModel):
    total_investigations: int
    total_transactions_analysed: int
    wallets_discovered: int
    suspicious_wallets: int
    high_risk_transactions: int
    probable_end_receivers: int
    mixer_patterns_detected: int
    cross_chain_activities: int
    recent_investigations: List[Dict[str, Any]]
    risk_distribution: Dict[str, int]
    timeline_activity: List[Dict[str, Any]]
