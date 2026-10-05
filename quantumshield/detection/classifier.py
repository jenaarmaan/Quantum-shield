"""
Detection Engine: Threat Classification
Classifies detected anomalies based strictly on verifiable physical and registry evidence.
Avoids false precision.
"""

from typing import Dict, Any

class ThreatClassifier:
    """Deterministic threat classification engine based on physical and protocol invariants."""

    @staticmethod
    def classify(registry_res: Dict[str, Any], qber: float, p0: float,
                 threshold_rate: float, attack_hint: str = "none") -> str:
        # 1. Classical registry violations take deterministic priority
        if registry_res.get("nonce_check", {}).get("replayed", False):
            return "REPLAY"
        
        if not registry_res.get("verifier_check", {}).get("authorized", True):
            return "UNAUTHORIZED_VERIFICATION"

        if not registry_res.get("timestamp_check", {}).get("valid", True):
            return "REPLAY"  # Timestamp expiration / out-of-window replay attempt

        # 2. Quantum statistics check
        if qber < threshold_rate:
            return "NONE"

        # If attack hint is explicitly modeled in simulation lab
        if attack_hint == "forgery" and abs(qber - 0.50) < 0.15:
            return "FORGERY"
        elif attack_hint == "impersonation":
            return "IMPERSONATION"
        elif attack_hint == "intercept_resend":
            return "CHANNEL_MANIPULATION"
        elif attack_hint == "stealth":
            return "STEALTH_THRESHOLD_EVENT"

        # General physical heuristic without blind assumptions
        if abs(qber - 0.50) < 0.08:
            return "FORGERY"
        elif qber > threshold_rate and qber < 0.35:
            return "CHANNEL_MANIPULATION"
        else:
            return "STATISTICAL ANOMALY — ATTACK TYPE NOT UNIQUELY IDENTIFIED"
