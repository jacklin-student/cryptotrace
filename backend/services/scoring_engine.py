import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger("cryptotrace.scoring")

# Feature labels for model explainability
FEATURE_NAMES = [
    "flow_fraction",
    "taint_score",
    "peel_depth",
    "mixer_exposure",
    "sanction_proximity",
    "in_degree",
    "out_degree",
    "adversarial_penalty"
]

class ScoringEngine:
    def __init__(self):
        # Initialize and pre-train Random Forest classifier on forensic feature distributions
        self.rf_model = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=5)
        self._init_model()

    def _init_model(self):
        """Initializes model on synthetic Elliptic-aligned forensic training vectors."""
        # Simulated feature vectors: [flow_frac, taint, peel_depth, mixer_exp, sanction_prox, in_deg, out_deg, adv_penalty]
        # Class 1: Illicit End-Receiver / Sink; Class 0: Regular Counterparty / Transit Node
        X_train = np.array([
            # Illicit Sinks / Accumulators
            [0.85, 0.90, 4, 0.0, 0.0, 3, 0, 0.0],
            [0.92, 0.85, 3, 0.8, 0.5, 2, 0, 0.0],
            [0.78, 0.95, 5, 1.0, 0.8, 4, 0, 0.0],
            [0.65, 0.75, 2, 0.5, 0.0, 2, 0, 0.0],
            [0.90, 0.88, 4, 0.0, 0.0, 1, 0, 0.0],
            [0.80, 0.82, 3, 0.7, 0.2, 2, 0, 0.0],
            # Intermediaries / Regular Nodes / Decoys
            [0.10, 0.20, 0, 0.0, 0.0, 1, 4, 0.0],
            [0.05, 0.15, 1, 0.0, 0.0, 1, 1, 0.0],
            [0.02, 0.05, 0, 0.0, 0.0, 1, 1, 0.3],  # Dust decoy
            [0.00, 0.01, 0, 0.0, 0.0, 1, 0, 0.5],  # Poisoning node
            [0.12, 0.30, 0, 0.0, 0.0, 2, 5, 0.0],
            [0.08, 0.22, 1, 0.0, 0.0, 1, 3, 0.0],
        ])
        y_train = np.array([1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0])
        self.rf_model.fit(X_train, y_train)

    def get_feature_importances(self) -> Dict[str, float]:
        """Returns relative feature importance weights from the trained Random Forest model."""
        importances = self.rf_model.feature_importances_
        return {
            name: round(float(weight), 4)
            for name, weight in zip(FEATURE_NAMES, importances)
        }

    def evaluate_graph_nodes(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        root_address: str,
        is_truncated: bool = False,
        chain: str = "BTC"
    ) -> List[Dict[str, Any]]:
        """
        Calculates taint propagation, flow fractions, adversarial penalties,
        confidence scores (0-100), and cyber-risk scores (0-100) for all nodes.
        Ranks top probable end receivers with plain-English reasoning.
        """
        # Calculate in-degree, out-degree, and total flow
        in_degrees: Dict[str, int] = {n["id"]: 0 for n in nodes}
        out_degrees: Dict[str, int] = {n["id"]: 0 for n in nodes}
        in_amount: Dict[str, float] = {n["id"]: 0.0 for n in nodes}
        out_amount: Dict[str, float] = {n["id"]: 0.0 for n in nodes}

        for e in edges:
            src, dst = e["from"], e["to"]
            amt = e.get("amount", 0.0)
            if src in out_degrees:
                out_degrees[src] += 1
                out_amount[src] += amt
            if dst in in_degrees:
                in_degrees[dst] += 1
                in_amount[dst] += amt

        # Root outflow as baseline
        root_outflow = out_amount.get(root_address, 1.0)
        if root_outflow <= 0:
            root_outflow = 1.0

        # Calculate Taint Score (propagating with decay)
        taint_map: Dict[str, float] = {root_address: 100.0}
        decay_factor = 0.88  # 12% decay per hop

        for e in edges:
            src, dst = e["from"], e["to"]
            src_taint = taint_map.get(src, 60.0)
            transfer_amt = e.get("amount", 0.0)
            src_total_out = max(out_amount.get(src, 1.0), 0.0001)

            # Proportional taint transfer
            edge_taint = src_taint * (transfer_amt / src_total_out) * decay_factor
            taint_map[dst] = min(100.0, taint_map.get(dst, 0.0) + edge_taint)

        candidate_receivers = []

        for node in nodes:
            addr = node["id"]
            if addr == root_address:
                node["risk_score"] = 80.0
                node["risk_level"] = "HIGH"
                node["confidence_score"] = 95.0
                node["is_probable_end_receiver"] = False
                continue

            in_deg = in_degrees.get(addr, 0)
            out_deg = out_degrees.get(addr, 0)
            flow_frac = min(1.0, in_amount.get(addr, 0.0) / root_outflow)
            taint = min(100.0, taint_map.get(addr, 40.0))

            # Heuristic tags lookup
            htags = node.get("heuristic_tags", [])
            ttags = node.get("threat_tags", [])

            # Check Peel Chain Depth
            peel_depth = 4 if "PEEL_CHANGE_NODE" in htags or "PEEL_END" in htags else 1 if "peel_spend" in htags else 0

            # Check Mixer Exposure
            mixer_exp = 1.0 if "MIXER_RECOMBINATION" in htags or "MIXER_POOL" in htags else 0.7 if "MIXER_EXIT_FORWARDER" in htags else 0.0

            # Check Sanction Proximity
            sanction_prox = 1.0 if "SANCTIONED_OFAC" in htags or "OFAC_SDN_MATCH" in ttags else 0.0

            # Check Adversarial Penalty (Dust, Poisoning, Decoys)
            adv_penalty = 0.0
            if "DUST_DECOY" in ttags or "ADDRESS_POISONING_SUSPECT" in ttags or "POISONING_ATTACK_TARGET" in ttags:
                adv_penalty = 25.0

            # Compute ML feature vector & prediction
            feature_vector = np.array([[
                flow_frac,
                taint / 100.0,
                peel_depth,
                mixer_exp,
                sanction_prox,
                in_deg,
                out_deg,
                adv_penalty / 100.0
            ]])
            ml_prob = float(self.rf_model.predict_proba(feature_vector)[0][1])

            # Rules-based composite scoring formula
            # Confidence: high flow share + high taint + low outbound velocity - adversarial penalty
            base_confidence = (flow_frac * 40.0) + (taint * 0.40) + ((1.0 if out_deg == 0 else 0.2) * 20.0)
            confidence = max(5.0, min(96.0, base_confidence - adv_penalty))

            # Cyber-Risk Score
            base_risk = (taint * 0.35) + (mixer_exp * 35.0) + (sanction_prox * 40.0) + (peel_depth * 5.0)
            if out_deg == 0 and flow_frac >= 0.5:
                base_risk += 15.0  # Terminal accumulator bonus
            risk_score = max(10.0, min(100.0, base_risk))

            # Risk Level Classification
            if risk_score >= 70 or sanction_prox > 0:
                risk_level = "HIGH"
            elif risk_score >= 40:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            # Probable End Receiver Classification (out_degree == 0, substantial flow or explicit sink tag)
            is_receiver = (out_deg == 0 and in_deg >= 1 and flow_frac >= 0.4 and adv_penalty == 0) or node.get("is_probable_end_receiver", False)

            node["confidence_score"] = round(confidence, 1)
            node["risk_score"] = round(risk_score, 1)
            node["risk_level"] = risk_level
            node["is_probable_end_receiver"] = is_receiver
            node["ml_probability"] = round(ml_prob * 100, 1)

            # Generate Explainable "Why Flagged" plain-English reasoning
            node["reasoning"] = self._generate_explainable_reasoning(
                addr=addr,
                flow_fraction=flow_frac,
                taint_score=taint,
                peel_depth=peel_depth,
                mixer_exp=mixer_exp,
                sanction_prox=sanction_prox,
                adv_penalty=adv_penalty,
                is_receiver=is_receiver,
                is_truncated=is_truncated,
                htags=htags,
                chain=chain
            )

            if is_receiver:
                candidate_receivers.append(node)

        # Sort and rank probable end receivers
        candidate_receivers.sort(key=lambda x: (x["confidence_score"], x["risk_score"]), reverse=True)
        for rank_idx, rec in enumerate(candidate_receivers):
            rec["rank"] = rank_idx + 1

        return nodes

    def _generate_explainable_reasoning(
        self,
        addr: str,
        flow_fraction: float,
        taint_score: float,
        peel_depth: int,
        mixer_exp: float,
        sanction_prox: float,
        adv_penalty: float,
        is_receiver: bool,
        is_truncated: bool,
        htags: List[str],
        chain: str
    ) -> str:
        """Constructs plain-English, explainable forensic reasoning adhering to language guidelines."""
        reasons = []

        if is_receiver:
            reasons.append(
                f"Probable end receiver: Absorbed {round(flow_fraction * 100, 1)}% of traced funds with "
                f"{round(taint_score, 1)}% residual taint and zero subsequent outbound forwarding."
            )
        elif flow_fraction >= 0.5:
            reasons.append(f"Significant intermediary channel retaining {round(flow_fraction * 100, 1)}% of traced volume.")

        if peel_depth >= 2:
            reasons.append(f"Terminal change accumulator following a {peel_depth}-stage peel chain sequence.")

        if mixer_exp > 0:
            reasons.append("Identified in direct temporal proximity to mixer withdrawal / recombination events.")

        if sanction_prox > 0:
            reasons.append("Topological adjacency to US OFAC Sanctioned entity.")

        if adv_penalty > 0:
            reasons.append("Confidence penalized (-25%) due to associated adversarial micro-dust or look-alike address manipulation.")

        if "EXPERIMENTAL_MATCH" in htags or "experimental_match" in htags:
            reasons.append("Cross-chain correlation identified; formally labeled EXPERIMENTAL.")

        if is_truncated:
            reasons.append("Data Warning: Multi-hop graph was truncated at boundary limits.")

        if not reasons:
            return "Standard intermediary wallet identified during multi-hop graph traversal."

        return " ".join(reasons)
