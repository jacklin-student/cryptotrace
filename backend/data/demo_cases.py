"""
CryptoTrace Comprehensive Offline Forensic Demo Cases
Contains realistic multi-hop graph structures, heuristic markers,
and adversarial cybersecurity artifacts for 100% offline demonstration.
"""

DEMO_CASES = {
    "demo-peel-chain": {
        "id": "demo-peel-chain",
        "title": "Bitcoin Multi-Hop Peel Chain Laundering",
        "target_address": "bc1q9x3peelchaindemo984719284710293847192",
        "target_type": "address",
        "target_chain": "BTC",
        "depth": 5,
        "description": "5-hop Bitcoin peel chain with recurring change address forward-propagation, small peel disbursements, micro-dust decoy injection, and accumulation by an unhosted probable end receiver.",
        "nodes": [
            {
                "id": "bc1q9x3peelchaindemo984719284710293847192",
                "label": "Target (Source Seed)",
                "chain": "BTC",
                "risk_score": 88.0,
                "risk_level": "HIGH",
                "confidence_score": 95.0,
                "is_probable_end_receiver": False,
                "cluster_id": "BTC-CLUS-001",
                "entity_label": "Compromised Treasury",
                "balance": 0.0,
                "heuristic_tags": ["SEED_SOURCE", "COMPROMISED"],
                "threat_tags": [],
                "reasoning": "Originating seed wallet associated with unauthorized treasury drain."
            },
            {
                "id": "bc1qpeel1change83920192837401928374019283",
                "label": "Peel Node #1 (Change)",
                "chain": "BTC",
                "risk_score": 75.0,
                "risk_level": "HIGH",
                "confidence_score": 85.0,
                "is_probable_end_receiver": False,
                "cluster_id": "BTC-CLUS-001",
                "balance": 0.0,
                "heuristic_tags": ["PEEL_CHAIN", "CHANGE_OUTPUT"],
                "threat_tags": [],
                "reasoning": "Retained 92% of input funds as change; forwarded to Peel Node #2."
            },
            {
                "id": "bc1qpeel1spend773920192837401928374019283",
                "label": "Peel #1 Merchant Spend",
                "chain": "BTC",
                "risk_score": 45.0,
                "risk_level": "MEDIUM",
                "confidence_score": 60.0,
                "is_probable_end_receiver": False,
                "balance": 0.95,
                "heuristic_tags": ["PEEL_SPEND"],
                "threat_tags": [],
                "reasoning": "Single small peel disbursement (0.95 BTC) to external unclustered address."
            },
            {
                "id": "bc1qpeel2change44920192837401928374019283",
                "label": "Peel Node #2 (Change)",
                "chain": "BTC",
                "risk_score": 78.0,
                "risk_level": "HIGH",
                "confidence_score": 82.0,
                "is_probable_end_receiver": False,
                "cluster_id": "BTC-CLUS-001",
                "balance": 0.0,
                "heuristic_tags": ["PEEL_CHAIN", "CHANGE_OUTPUT"],
                "threat_tags": [],
                "reasoning": "Forwarded 10.45 BTC forward after peeling off 0.50 BTC."
            },
            {
                "id": "bc1qpeel2spend223920192837401928374019283",
                "label": "Peel #2 Cashout Outlier",
                "chain": "BTC",
                "risk_score": 50.0,
                "risk_level": "MEDIUM",
                "confidence_score": 65.0,
                "is_probable_end_receiver": False,
                "balance": 0.50,
                "heuristic_tags": ["PEEL_SPEND"],
                "threat_tags": [],
                "reasoning": "Small peel branch payment."
            },
            {
                "id": "bc1qpeel3change11920192837401928374019283",
                "label": "Peel Node #3 (Change)",
                "chain": "BTC",
                "risk_score": 82.0,
                "risk_level": "HIGH",
                "confidence_score": 80.0,
                "is_probable_end_receiver": False,
                "cluster_id": "BTC-CLUS-001",
                "balance": 0.0,
                "heuristic_tags": ["PEEL_CHAIN", "CHANGE_OUTPUT"],
                "threat_tags": [],
                "reasoning": "Third sequential peel hop; transmitted 9.80 BTC to final aggregator."
            },
            {
                "id": "bc1q8f7e2k947192038471928374019283746152",
                "label": "Probable End Receiver",
                "chain": "BTC",
                "risk_score": 91.5,
                "risk_level": "HIGH",
                "confidence_score": 89.4,
                "is_probable_end_receiver": True,
                "rank": 1,
                "balance": 9.80,
                "heuristic_tags": ["END_RECEIVER", "VALUE_ACCUMULATOR", "UNHOSTED_WALLET"],
                "threat_tags": [],
                "reasoning": "Probable end receiver: Absorbed 78.4% (9.80 BTC) of initial stolen funds after 4 peel hops with zero subsequent outgoing velocity over >90 days."
            },
            {
                "id": "bc1qdustdecoy9999019283740192837401928374",
                "label": "Adversarial Dust Decoy",
                "chain": "BTC",
                "risk_score": 62.0,
                "risk_level": "MEDIUM",
                "confidence_score": 35.0,
                "is_probable_end_receiver": False,
                "balance": 0.00005460,
                "heuristic_tags": ["DUSTING_DECOY"],
                "threat_tags": ["DUST_DECOY"],
                "reasoning": "Adversarial artifact: 546 satoshi dust output inserted during Peel Hop #2 to create artificial edge noise."
            }
        ],
        "edges": [
            {
                "id": "e1",
                "from": "bc1q9x3peelchaindemo984719284710293847192",
                "to": "bc1qpeel1change83920192837401928374019283",
                "tx_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
                "amount": 11.45,
                "hop_number": 1,
                "chain": "BTC",
                "heuristic_tags": ["peel_change"],
                "is_adversarial": False,
                "edge_type": "PEEL_FORWARD"
            },
            {
                "id": "e2",
                "from": "bc1q9x3peelchaindemo984719284710293847192",
                "to": "bc1qpeel1spend773920192837401928374019283",
                "tx_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
                "amount": 0.95,
                "hop_number": 1,
                "chain": "BTC",
                "heuristic_tags": ["peel_spend"],
                "is_adversarial": False,
                "edge_type": "TRANSFER"
            },
            {
                "id": "e3",
                "from": "bc1qpeel1change83920192837401928374019283",
                "to": "bc1qpeel2change44920192837401928374019283",
                "tx_hash": "b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01",
                "amount": 10.45,
                "hop_number": 2,
                "chain": "BTC",
                "heuristic_tags": ["peel_change"],
                "is_adversarial": False,
                "edge_type": "PEEL_FORWARD"
            },
            {
                "id": "e4",
                "from": "bc1qpeel1change83920192837401928374019283",
                "to": "bc1qpeel2spend223920192837401928374019283",
                "tx_hash": "b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01",
                "amount": 0.50,
                "hop_number": 2,
                "chain": "BTC",
                "heuristic_tags": ["peel_spend"],
                "is_adversarial": False,
                "edge_type": "TRANSFER"
            },
            {
                "id": "e5_dust",
                "from": "bc1qpeel1change83920192837401928374019283",
                "to": "bc1qdustdecoy9999019283740192837401928374",
                "tx_hash": "b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01",
                "amount": 0.00005460,
                "hop_number": 2,
                "chain": "BTC",
                "heuristic_tags": ["dust_decoy"],
                "is_adversarial": True,
                "edge_type": "POISON_DUST"
            },
            {
                "id": "e6",
                "from": "bc1qpeel2change44920192837401928374019283",
                "to": "bc1qpeel3change11920192837401928374019283",
                "tx_hash": "c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012",
                "amount": 9.95,
                "hop_number": 3,
                "chain": "BTC",
                "heuristic_tags": ["peel_change"],
                "is_adversarial": False,
                "edge_type": "PEEL_FORWARD"
            },
            {
                "id": "e7",
                "from": "bc1qpeel3change11920192837401928374019283",
                "to": "bc1q8f7e2k947192038471928374019283746152",
                "tx_hash": "d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0123",
                "amount": 9.80,
                "hop_number": 4,
                "chain": "BTC",
                "heuristic_tags": ["terminal_peel_destination"],
                "is_adversarial": False,
                "edge_type": "TRANSFER"
            }
        ],
        "alerts": [
            {
                "threat_type": "PEEL_CHAIN",
                "severity": "HIGH",
                "title": "Extended 4-Hop Peel Chain Pattern Detected",
                "description": "Continuous change address forwarding identified. 78.4% of funds moved systematically through 4 peel steps before accumulating at an unhosted terminal wallet.",
                "affected_wallets": [
                    "bc1q9x3peelchaindemo984719284710293847192",
                    "bc1qpeel1change83920192837401928374019283",
                    "bc1q8f7e2k947192038471928374019283746152"
                ],
                "evidence": {"peel_hops": 4, "total_peeled_btc": 2.65, "accumulated_btc": 9.80}
            },
            {
                "threat_type": "DUST_DECOY",
                "severity": "MEDIUM",
                "title": "Adversarial Micro-Dusting Output Flagged",
                "description": "Tx b2c3... included a 546 satoshi dust output. Adversarial penalty applied to avoid graph path bloat.",
                "affected_wallets": ["bc1qdustdecoy9999019283740192837401928374"],
                "evidence": {"dust_amount_sat": 546, "is_pruned": True}
            }
        ]
    },

    "demo-mixer": {
        "id": "demo-mixer",
        "title": "Mixer Fan-In / Fan-Out Obfuscation (ETH)",
        "target_address": "0x3c21a4f009384918239019283401923849102934",
        "target_type": "address",
        "target_chain": "ETH",
        "depth": 5,
        "description": "Aggregated fan-in of illicit funds into an intermediate collector, interaction with OFAC-sanctioned Tornado Cash 100 ETH Pool, equal-value fan-out dispersal, and recombining by a probable end receiver.",
        "nodes": [
            {
                "id": "0x3c21a4f009384918239019283401923849102934",
                "label": "Target (Source Infiltrator)",
                "chain": "ETH",
                "risk_score": 92.0,
                "risk_level": "HIGH",
                "confidence_score": 98.0,
                "is_probable_end_receiver": False,
                "entity_label": "Exploit Drainer",
                "balance": 0.5,
                "heuristic_tags": ["EXPLOIT_SOURCE"],
                "threat_tags": [],
                "reasoning": "Originating illicit collector initiating mixer obfuscation."
            },
            {
                "id": "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
                "label": "Tornado Cash: 100 ETH Pool",
                "chain": "ETH",
                "risk_score": 100.0,
                "risk_level": "HIGH",
                "confidence_score": 100.0,
                "is_probable_end_receiver": False,
                "entity_label": "Tornado Cash (OFAC Sanctioned)",
                "balance": 2450.0,
                "heuristic_tags": ["MIXER_POOL", "SANCTIONED_OFAC"],
                "threat_tags": ["OFAC_SANCTION_PROXIMITY"],
                "reasoning": "Direct interaction with US OFAC Sanctioned smart contract."
            },
            {
                "id": "0x89ab102938471029384710293847102938471029",
                "label": "Mixer Exit Forwarder A",
                "chain": "ETH",
                "risk_score": 84.0,
                "risk_level": "HIGH",
                "confidence_score": 80.0,
                "is_probable_end_receiver": False,
                "balance": 0.0,
                "heuristic_tags": ["MIXER_FAN_OUT", "RELAYER_EXIT"],
                "threat_tags": [],
                "reasoning": "Received 100 ETH mixer exit withdrawal with low block lag."
            },
            {
                "id": "0x7654102938471029384710293847102938471029",
                "label": "Mixer Exit Forwarder B",
                "chain": "ETH",
                "risk_score": 82.0,
                "risk_level": "HIGH",
                "confidence_score": 78.0,
                "is_probable_end_receiver": False,
                "balance": 0.0,
                "heuristic_tags": ["MIXER_FAN_OUT", "RELAYER_EXIT"],
                "threat_tags": [],
                "reasoning": "Coordinated exit transfer matching Exit Forwarder A timestamp (+4 mins)."
            },
            {
                "id": "0x9182390192834019238491029340192834019283",
                "label": "Probable End Receiver (Consolidator)",
                "chain": "ETH",
                "risk_score": 94.0,
                "risk_level": "HIGH",
                "confidence_score": 87.6,
                "is_probable_end_receiver": True,
                "rank": 1,
                "balance": 198.8,
                "heuristic_tags": ["END_RECEIVER", "MIXER_RECOMBINATION", "UNHOSTED_WALLET"],
                "threat_tags": [],
                "reasoning": "Probable end receiver: Re-aggregated 198.8 ETH from two separate mixer exit forwarders within 35 minutes of withdrawal. High mixer taint retention (98.2%)."
            },
            {
                "id": "0xdec0710293847102938471029384710293847102",
                "label": "Decoy Dispersal Node",
                "chain": "ETH",
                "risk_score": 55.0,
                "risk_level": "MEDIUM",
                "confidence_score": 40.0,
                "is_probable_end_receiver": False,
                "balance": 1.0,
                "heuristic_tags": ["DECOY_TRANSFER"],
                "threat_tags": ["GRAPH_POISONING"],
                "reasoning": "Adversarial decoy node created to split attention and mimic parallel exit path."
            }
        ],
        "edges": [
            {
                "id": "me1",
                "from": "0x3c21a4f009384918239019283401923849102934",
                "to": "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
                "tx_hash": "0xfe112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
                "amount": 200.0,
                "hop_number": 1,
                "chain": "ETH",
                "heuristic_tags": ["mixer_deposit"],
                "is_adversarial": False,
                "edge_type": "TRANSFER"
            },
            {
                "id": "me2",
                "from": "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
                "to": "0x89ab102938471029384710293847102938471029",
                "tx_hash": "0xaa112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
                "amount": 100.0,
                "hop_number": 2,
                "chain": "ETH",
                "heuristic_tags": ["mixer_fan_out"],
                "is_adversarial": False,
                "edge_type": "MIXER_FAN_OUT"
            },
            {
                "id": "me3",
                "from": "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
                "to": "0x7654102938471029384710293847102938471029",
                "tx_hash": "0xbb112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
                "amount": 100.0,
                "hop_number": 2,
                "chain": "ETH",
                "heuristic_tags": ["mixer_fan_out"],
                "is_adversarial": False,
                "edge_type": "MIXER_FAN_OUT"
            },
            {
                "id": "me4",
                "from": "0x89ab102938471029384710293847102938471029",
                "to": "0x9182390192834019238491029340192834019283",
                "tx_hash": "0xcc112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
                "amount": 99.4,
                "hop_number": 3,
                "chain": "ETH",
                "heuristic_tags": ["recombination"],
                "is_adversarial": False,
                "edge_type": "TRANSFER"
            },
            {
                "id": "me5",
                "from": "0x7654102938471029384710293847102938471029",
                "to": "0x9182390192834019238491029340192834019283",
                "tx_hash": "0xdd112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
                "amount": 99.4,
                "hop_number": 3,
                "chain": "ETH",
                "heuristic_tags": ["recombination"],
                "is_adversarial": False,
                "edge_type": "TRANSFER"
            },
            {
                "id": "me6_decoy",
                "from": "0x89ab102938471029384710293847102938471029",
                "to": "0xdec0710293847102938471029384710293847102",
                "tx_hash": "0xee112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
                "amount": 0.5,
                "hop_number": 3,
                "chain": "ETH",
                "heuristic_tags": ["decoy_edge"],
                "is_adversarial": True,
                "edge_type": "TRANSFER"
            }
        ],
        "alerts": [
            {
                "threat_type": "MIXER_FAN_IN_OUT",
                "severity": "CRITICAL",
                "title": "Sanctioned Mixer Pool Interaction & Recombination",
                "description": "Identified direct 200 ETH deposit into Tornado Cash 100 ETH Pool (OFAC CYBER2) followed by dual fan-out and 198.8 ETH recombination.",
                "affected_wallets": [
                    "0x3c21a4f009384918239019283401923849102934",
                    "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
                    "0x9182390192834019238491029340192834019283"
                ],
                "evidence": {"mixer_contract": "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936", "recombined_eth": 198.8}
            }
        ]
    },

    "demo-poisoning": {
        "id": "demo-poisoning",
        "title": "Address Poisoning & Dusting Defense (ETH)",
        "target_address": "0x8b32948192038471928347102938471920384712",
        "target_type": "address",
        "target_chain": "ETH",
        "depth": 3,
        "description": "Adversarial address poisoning attack where a vanity address matches the prefix ('0x8b32...') and suffix ('...4712') of the legitimate counterparty, combined with zero-value dusting.",
        "nodes": [
            {
                "id": "0x8b32948192038471928347102938471920384712",
                "label": "Victim / Target Wallet",
                "chain": "ETH",
                "risk_score": 68.0,
                "risk_level": "MEDIUM",
                "confidence_score": 90.0,
                "is_probable_end_receiver": False,
                "balance": 15.2,
                "heuristic_tags": ["VICTIM_WALLET", "TARGET"],
                "threat_tags": ["POISONING_ATTACK_TARGET"],
                "reasoning": "High-volume active wallet targeted by clipboard address poisoning campaign."
            },
            {
                "id": "0x8b32000000000000000000000000000000004712",
                "label": "Poison Look-Alike Wallet (Adversarial)",
                "chain": "ETH",
                "risk_score": 96.0,
                "risk_level": "HIGH",
                "confidence_score": 94.0,
                "is_probable_end_receiver": False,
                "entity_label": "Adversarial Poisoner",
                "balance": 0.00001,
                "heuristic_tags": ["LOOKALIKE_VANITY", "ATTACKER_CONTRACT"],
                "threat_tags": ["ADDRESS_POISONING", "VANITY_SPOOF"],
                "reasoning": "Adversarial vanity address matching first 6 ('0x8b32') and last 4 ('4712') characters of counterparty. Designed to deceive users during clipboard paste."
            },
            {
                "id": "0x8b32777711112222333344445555666677774712",
                "label": "Legitimate Counterparty",
                "chain": "ETH",
                "risk_score": 15.0,
                "risk_level": "LOW",
                "confidence_score": 92.0,
                "is_probable_end_receiver": False,
                "entity_label": "Regular Vendor",
                "balance": 45.0,
                "heuristic_tags": ["LEGITIMATE_COUNTERPARTY"],
                "threat_tags": [],
                "reasoning": "Authentic long-term trading counterparty with historical volume."
            },
            {
                "id": "0xfa11002233445566778899aabbccddeeff001122",
                "label": "Probable Attacker Cashout Wallet",
                "chain": "ETH",
                "risk_score": 92.0,
                "risk_level": "HIGH",
                "confidence_score": 84.0,
                "is_probable_end_receiver": True,
                "rank": 1,
                "balance": 12.0,
                "heuristic_tags": ["END_RECEIVER", "EXPLOIT_OPERATOR"],
                "threat_tags": ["POISONING_COLLECTOR"],
                "reasoning": "Probable end receiver: Funded the gas for the vanity poisoning address factory and swept intercepted spoofed transactions."
            }
        ],
        "edges": [
            {
                "id": "pe1_legit",
                "from": "0x8b32948192038471928347102938471920384712",
                "to": "0x8b32777711112222333344445555666677774712",
                "tx_hash": "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
                "amount": 10.0,
                "hop_number": 1,
                "chain": "ETH",
                "heuristic_tags": ["legitimate_payment"],
                "is_adversarial": False,
                "edge_type": "TRANSFER"
            },
            {
                "id": "pe2_poison",
                "from": "0x8b32000000000000000000000000000000004712",
                "to": "0x8b32948192038471928347102938471920384712",
                "tx_hash": "0x222233334444555566667777888899990000aaaabbbbccccddddeeeeffff0000",
                "amount": 0.0000001,
                "hop_number": 1,
                "chain": "ETH",
                "heuristic_tags": ["poison_dust"],
                "is_adversarial": True,
                "edge_type": "POISON_DUST"
            },
            {
                "id": "pe3_gas",
                "from": "0xfa11002233445566778899aabbccddeeff001122",
                "to": "0x8b32000000000000000000000000000000004712",
                "tx_hash": "0x33334444555566667777888899990000aaaabbbbccccddddeeeeffff00001111",
                "amount": 0.25,
                "hop_number": 2,
                "chain": "ETH",
                "heuristic_tags": ["gas_funder"],
                "is_adversarial": True,
                "edge_type": "TRANSFER"
            }
        ],
        "alerts": [
            {
                "threat_type": "ADDRESS_POISONING",
                "severity": "CRITICAL",
                "title": "Vanity Address Poisoning Attack Active",
                "description": "Attacker address 0x8b32...4712 shares matching 6-char prefix and 4-char suffix with trusted counterparty 0x8b32...4712. Micro-dust transferred to inject spoofed address into recent activity.",
                "affected_wallets": [
                    "0x8b32948192038471928347102938471920384712",
                    "0x8b32000000000000000000000000000000004712"
                ],
                "evidence": {
                    "prefix_match": "0x8b32",
                    "suffix_match": "4712",
                    "levenshtein_distance": 22,
                    "countermeasure": "Adversarial penalty applied: poison node isolated from clustering."
                }
            }
        ]
    },

    "demo-bridge": {
        "id": "demo-bridge",
        "title": "Cross-Chain Bridge Correlation (ETH -> Polygon)",
        "target_address": "0x71c2938471029384710293847102938471029384",
        "target_type": "address",
        "target_chain": "ETH",
        "depth": 5,
        "description": "Cross-chain fund hop tracing across Ethereum and Polygon. Temporal window (9 mins) and exact value correlation (49.95 ETH -> 49.95 WETH) between Ethereum bridge lock event and Polygon mint.",
        "nodes": [
            {
                "id": "0x71c2938471029384710293847102938471029384",
                "label": "Target (Ethereum Origin)",
                "chain": "ETH",
                "risk_score": 85.0,
                "risk_level": "HIGH",
                "confidence_score": 90.0,
                "is_probable_end_receiver": False,
                "balance": 0.1,
                "heuristic_tags": ["BRIDGE_ORIGIN"],
                "threat_tags": [],
                "reasoning": "Deposited 50.0 ETH into Polygon PoS Bridge contract."
            },
            {
                "id": "0xa0c68c638235ee32657e8f720a23cec1bfc77c77",
                "label": "Polygon (Matic): PoS Bridge Contract",
                "chain": "ETH",
                "risk_score": 10.0,
                "risk_level": "LOW",
                "confidence_score": 100.0,
                "is_probable_end_receiver": False,
                "entity_label": "Polygon PoS Bridge",
                "balance": 182400.0,
                "heuristic_tags": ["DEFI_BRIDGE", "ESCROW_CONTRACT"],
                "threat_tags": [],
                "reasoning": "Legitimate verified cross-chain bridge escrow contract on Ethereum."
            },
            {
                "id": "0x7b8899aabbccddeeff00112233445566778899aa",
                "label": "Polygon Child Predicate / Mint Router",
                "chain": "POLYGON",
                "risk_score": 10.0,
                "risk_level": "LOW",
                "confidence_score": 95.0,
                "is_probable_end_receiver": False,
                "entity_label": "Polygon Mint Gateway",
                "balance": 0.0,
                "heuristic_tags": ["CROSS_CHAIN_RELAY"],
                "threat_tags": [],
                "reasoning": "State synchronization validator router triggering mint on destination chain."
            },
            {
                "id": "0xee99887766554433221100ffeeddccbbaa998877",
                "label": "Probable End Receiver (Polygon Destination)",
                "chain": "POLYGON",
                "risk_score": 87.0,
                "risk_level": "HIGH",
                "confidence_score": 81.2,
                "is_probable_end_receiver": True,
                "rank": 1,
                "balance": 49.95,
                "heuristic_tags": ["END_RECEIVER", "CROSS_CHAIN_DESTINATION", "EXPERIMENTAL_MATCH"],
                "threat_tags": [],
                "reasoning": "Probable end receiver: Received 49.95 WETH on Polygon precisely 9.2 minutes following Ethereum deposit (minus 0.05 ETH bridge relayer fee). Labeled EXPERIMENTAL due to cross-chain heuristic nature."
            }
        ],
        "edges": [
            {
                "id": "be1",
                "from": "0x71c2938471029384710293847102938471029384",
                "to": "0xa0c68c638235ee32657e8f720a23cec1bfc77c77",
                "tx_hash": "0x7777888899990000aaaabbbbccccddddeeeeffff000011112222333344445555",
                "amount": 50.0,
                "hop_number": 1,
                "chain": "ETH",
                "heuristic_tags": ["bridge_lock"],
                "is_adversarial": False,
                "edge_type": "BRIDGE"
            },
            {
                "id": "be2_relay",
                "from": "0xa0c68c638235ee32657e8f720a23cec1bfc77c77",
                "to": "0x7b8899aabbccddeeff00112233445566778899aa",
                "tx_hash": "0x888899990000aaaabbbbccccddddeeeeffff0000111122223333444455556666",
                "amount": 49.95,
                "hop_number": 2,
                "chain": "CROSS_CHAIN",
                "heuristic_tags": ["state_sync"],
                "is_adversarial": False,
                "edge_type": "BRIDGE"
            },
            {
                "id": "be3_mint",
                "from": "0x7b8899aabbccddeeff00112233445566778899aa",
                "to": "0xee99887766554433221100ffeeddccbbaa998877",
                "tx_hash": "0x99990000aaaabbbbccccddddeeeeffff00001111222233334444555566667777",
                "amount": 49.95,
                "hop_number": 3,
                "chain": "POLYGON",
                "heuristic_tags": ["bridge_mint", "experimental_match"],
                "is_adversarial": False,
                "edge_type": "TRANSFER"
            }
        ],
        "alerts": [
            {
                "threat_type": "CROSS_CHAIN_BRIDGE",
                "severity": "MEDIUM",
                "title": "Cross-Chain Capital Evasion via Polygon PoS Bridge",
                "description": "Temporal correlation within 9.2 minute window and value correlation (49.95 WETH matched to 50.0 ETH lock). Designated as EXPERIMENTAL.",
                "affected_wallets": [
                    "0x71c2938471029384710293847102938471029384",
                    "0xee99887766554433221100ffeeddccbbaa998877"
                ],
                "evidence": {
                    "source_chain": "ETH",
                    "destination_chain": "POLYGON",
                    "bridge_contract": "0xa0c68c638235ee32657e8f720a23cec1bfc77c77",
                    "time_delta_seconds": 552,
                    "confidence_label": "EXPERIMENTAL"
                }
            }
        ]
    }
}
