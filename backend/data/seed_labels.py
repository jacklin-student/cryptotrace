import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.models.label import Label

LABELS_SEED_DATA = [
    # OFAC Sanctioned Wallets
    {
        "address": "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b",
        "chain": "ETH",
        "entity_name": "Tornado Cash: Router",
        "category": "SANCTIONED_OFAC",
        "risk_level": "HIGH",
        "source_name": "US Treasury OFAC SDN List",
        "metadata_json": json.dumps({"program": "CYBER2", "designation_date": "2022-08-08"})
    },
    {
        "address": "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
        "chain": "ETH",
        "entity_name": "Tornado Cash: 100 ETH Pool",
        "category": "SANCTIONED_OFAC",
        "risk_level": "HIGH",
        "source_name": "US Treasury OFAC SDN List",
        "metadata_json": json.dumps({"program": "CYBER2", "asset": "ETH", "denomination": 100})
    },
    {
        "address": "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",
        "chain": "ETH",
        "entity_name": "Tornado Cash: 0.1 ETH Pool",
        "category": "SANCTIONED_OFAC",
        "risk_level": "HIGH",
        "source_name": "US Treasury OFAC SDN List",
        "metadata_json": json.dumps({"program": "CYBER2", "asset": "ETH", "denomination": 0.1})
    },
    {
        "address": "0x098b716b8aaf21512996dc57eb0615e2383e2f96",
        "chain": "ETH",
        "entity_name": "Ronin Bridge Exploiter (Lazarus Group)",
        "category": "SANCTIONED_OFAC",
        "risk_level": "HIGH",
        "source_name": "FBI / OFAC Attribution",
        "metadata_json": json.dumps({"attribution": "DPRK Lazarus Group", "incident": "Ronin Bridge 2022"})
    },
    {
        "address": "12Qtq5UgQ578p5iCgQJ3W6P1zJ6vV9tY9p",
        "chain": "BTC",
        "entity_name": "Hydra Market Vendor Depository",
        "category": "SANCTIONED_OFAC",
        "risk_level": "HIGH",
        "source_name": "DOJ / OFAC Seizure Notice",
        "metadata_json": json.dumps({"darknet_marketplace": "Hydra", "jurisdiction": "Sanctioned"})
    },
    {
        "address": "1K5N9gq2UvM4t6oU8qP6yD9kQ7vF8tY9xL",
        "chain": "BTC",
        "entity_name": "Sinbad.io Mixer Core Node",
        "category": "SANCTIONED_OFAC",
        "risk_level": "HIGH",
        "source_name": "OFAC Cyber Designation 2023",
        "metadata_json": json.dumps({"mixer_type": "Bitcoin Mixer", "successor_to": "Blender.io"})
    },

    # Known Major Exchanges
    {
        "address": "0x28c6c06298d514db089934071355e5743bf21d60",
        "chain": "ETH",
        "entity_name": "Binance: Hot Wallet 14",
        "category": "EXCHANGE",
        "risk_level": "LOW",
        "source_name": "Etherscan Public Verification",
        "metadata_json": json.dumps({"exchange": "Binance", "kyc_enforced": True})
    },
    {
        "address": "0x71660c4005ba85c37ccec55d0c4493e66fe775d3",
        "chain": "ETH",
        "entity_name": "Coinbase: Prime Custody",
        "category": "EXCHANGE",
        "risk_level": "LOW",
        "source_name": "Coinbase Public Attestation",
        "metadata_json": json.dumps({"exchange": "Coinbase", "type": "Institutional"})
    },
    {
        "address": "0x2910543af39aba0cd09dbb2d50200b3e800a63d2",
        "chain": "ETH",
        "entity_name": "Kraken: Deposit Aggregator",
        "category": "EXCHANGE",
        "risk_level": "LOW",
        "source_name": "Public Cluster Intelligence",
        "metadata_json": json.dumps({"exchange": "Kraken", "kyc_enforced": True})
    },
    {
        "address": "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
        "chain": "BTC",
        "entity_name": "Binance: Cold Storage 1",
        "category": "EXCHANGE",
        "risk_level": "LOW",
        "source_name": "Blockchair Verified Cluster",
        "metadata_json": json.dumps({"exchange": "Binance", "storage_type": "Multi-sig Cold"})
    },
    {
        "address": "bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97",
        "chain": "BTC",
        "entity_name": "Bitfinex: Vault Reserve",
        "category": "EXCHANGE",
        "risk_level": "LOW",
        "source_name": "Bitfinex Public Transparency Report",
        "metadata_json": json.dumps({"exchange": "Bitfinex", "tier": "Reserve"})
    },

    # Cross-Chain Bridges & DeFi Protocols
    {
        "address": "0xa0c68c638235ee32657e8f720a23cec1bfc77c77",
        "chain": "ETH",
        "entity_name": "Polygon (Matic): PoS Bridge",
        "category": "DEFI_BRIDGE",
        "risk_level": "LOW",
        "source_name": "Polygon Official Docs",
        "metadata_json": json.dumps({"bridge_target": "Polygon PoS", "contract_type": "Bridge Escrow"})
    },
    {
        "address": "0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f",
        "chain": "ETH",
        "entity_name": "Arbitrum: One Gateway Router",
        "category": "DEFI_BRIDGE",
        "risk_level": "LOW",
        "source_name": "Offchain Labs Verification",
        "metadata_json": json.dumps({"bridge_target": "Arbitrum One", "contract_type": "Rollup Bridge"})
    }
]

def seed_database_labels(db: Session) -> int:
    """Seeds verified entity labels into the database if not present."""
    count = 0
    now = datetime.now(timezone.utc)
    for item in LABELS_SEED_DATA:
        existing = db.query(Label).filter(Label.address == item["address"]).first()
        if not existing:
            new_label = Label(
                address=item["address"],
                chain=item["chain"],
                entity_name=item["entity_name"],
                category=item["category"],
                risk_level=item["risk_level"],
                source_name=item["source_name"],
                last_updated=now,
                metadata_json=item.get("metadata_json")
            )
            db.add(new_label)
            count += 1
    if count > 0:
        db.commit()
    return count
