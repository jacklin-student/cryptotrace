import re
from typing import Dict, Any, Optional

# Bitcoin regexes
BTC_P2PKH_REGEX = r'^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$'           # Legacy (1...)
BTC_P2SH_REGEX = r'^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$'            # P2SH (3...)
BTC_BECH32_REGEX = r'^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$'      # SegWit (bc1q..., bc1p...)
BTC_TX_HASH_REGEX = r'^[a-fA-F0-9]{64}$'

# Ethereum regexes
ETH_ADDRESS_REGEX = r'^0x[a-fA-F0-9]{40}$'
ETH_TX_HASH_REGEX = r'^0x[a-fA-F0-9]{64}$'

def detect_identifier(query: str) -> Dict[str, Any]:
    """
    Auto-detects whether the input string is a BTC address, BTC tx hash,
    ETH address, or ETH tx hash. Rejects invalid or ambiguous inputs.
    """
    clean = query.strip()
    if not clean:
        return {
            "valid": False,
            "error": "Query identifier cannot be empty.",
            "target": clean,
            "chain": None,
            "type": None
        }

    # 1. Check Ethereum Address (0x + 40 hex chars)
    if re.match(ETH_ADDRESS_REGEX, clean):
        return {
            "valid": True,
            "target": clean.lower(),
            "chain": "ETH",
            "type": "address",
            "format": "ERC-20/Ethereum Address",
            "error": None
        }

    # 2. Check Ethereum Transaction Hash (0x + 64 hex chars)
    if re.match(ETH_TX_HASH_REGEX, clean):
        return {
            "valid": True,
            "target": clean.lower(),
            "chain": "ETH",
            "type": "tx_hash",
            "format": "Ethereum Transaction Hash",
            "error": None
        }

    # 3. Check Bitcoin Bech32 Address (bc1...)
    if clean.lower().startswith("bc1") and re.match(r'^bc1[a-z0-9]{11,71}$', clean.lower()):
        return {
            "valid": True,
            "target": clean.lower(),
            "chain": "BTC",
            "type": "address",
            "format": "Bitcoin Bech32 / SegWit Address",
            "error": None
        }

    # 4. Check Bitcoin Legacy / P2SH Address
    if re.match(BTC_P2PKH_REGEX, clean) or re.match(BTC_P2SH_REGEX, clean):
        return {
            "valid": True,
            "target": clean,
            "chain": "BTC",
            "type": "address",
            "format": "Bitcoin Base58 Address",
            "error": None
        }

    # 5. Check 64-char Hex (could be BTC tx hash or raw ETH hash without 0x)
    if re.match(BTC_TX_HASH_REGEX, clean):
        return {
            "valid": True,
            "target": clean.lower(),
            "chain": "BTC",
            "type": "tx_hash",
            "format": "Bitcoin Transaction Hash (or un-prefixed 32-byte hex)",
            "error": None
        }

    # If it starts with 0x but wrong length
    if clean.startswith("0x"):
        return {
            "valid": False,
            "target": clean,
            "chain": "ETH",
            "type": "unknown",
            "error": f"Invalid Ethereum identifier length ({len(clean)} chars). Expected 42 for address or 66 for tx hash."
        }

    # Default failure
    return {
        "valid": False,
        "target": clean,
        "chain": None,
        "type": "unknown",
        "error": "Unrecognized cryptocurrency format. Must be a valid BTC/ETH address or transaction hash."
    }
