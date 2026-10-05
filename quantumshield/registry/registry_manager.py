"""
Registry System: Nonce, Timestamp, and Verifier Registry
Enforces classical cryptographic protections against replay, expiration, and unauthorized verification.
"""

from typing import Set, Dict, Any, Optional
import time

class NonceRegistry:
    """Tracks seen cryptographic nonces to detect replay attacks."""
    def __init__(self):
        # Maps nonce -> {timestamp, experiment_id, verifier_id}
        self._seen_nonces: Dict[str, Dict[str, Any]] = {}

    def register(self, nonce: str, experiment_id: str, verifier_id: str) -> bool:
        """Returns True if nonce is fresh, False if already seen (replay)."""
        if nonce in self._seen_nonces:
            return False
        self._seen_nonces[nonce] = {
            "first_seen": time.time(),
            "experiment_id": experiment_id,
            "verifier_id": verifier_id
        }
        return True

    def is_seen(self, nonce: str) -> bool:
        return nonce in self._seen_nonces

    def clear(self):
        self._seen_nonces.clear()


class TimestampRegistry:
    """Enforces valid timestamp acceptance window (e.g. +/- 300 seconds)."""
    def __init__(self, max_skew_seconds: float = 300.0):
        self.max_skew_seconds = float(max_skew_seconds)

    def validate(self, timestamp: float, current_time: Optional[float] = None) -> Dict[str, Any]:
        now = current_time if current_time is not None else time.time()
        skew = abs(now - timestamp)
        valid = skew <= self.max_skew_seconds
        return {
            "valid": valid,
            "skew_seconds": skew,
            "max_skew_seconds": self.max_skew_seconds,
            "timestamp": timestamp,
            "current_time": now
        }


class VerifierRegistry:
    """Manages authorized verifier identities and permissions."""
    def __init__(self):
        # Default authorized verifiers
        self._verifiers: Dict[str, Dict[str, Any]] = {
            "verifier_bob": {"name": "Bob (Primary Verifier)", "authorized": True, "role": "auditor"},
            "verifier_charlie": {"name": "Charlie (Secondary Verifier)", "authorized": True, "role": "auditor"},
            "verifier_eval_lab": {"name": "Evaluation Lab Testbed", "authorized": True, "role": "researcher"},
            "verifier_mobile_local": {"name": "On-Device Verifier", "authorized": True, "role": "device"}
        }

    def is_authorized(self, verifier_id: str) -> bool:
        record = self._verifiers.get(verifier_id)
        if not record:
            return False
        return bool(record.get("authorized", False))

    def register_verifier(self, verifier_id: str, name: str, role: str = "auditor") -> None:
        self._verifiers[verifier_id] = {
            "name": name,
            "authorized": True,
            "role": role
        }

    def revoke_verifier(self, verifier_id: str) -> None:
        if verifier_id in self._verifiers:
            self._verifiers[verifier_id]["authorized"] = False


class RegistryManager:
    """Central registry manager combining Nonce, Timestamp, and Verifier checks."""
    def __init__(self, max_skew_seconds: float = 300.0):
        self.nonce_registry = NonceRegistry()
        self.timestamp_registry = TimestampRegistry(max_skew_seconds)
        self.verifier_registry = VerifierRegistry()

    def check_and_register(self, nonce: str, timestamp: float, verifier_id: str,
                           experiment_id: str, current_time: Optional[float] = None) -> Dict[str, Any]:
        """
        Runs all 3 registry checks:
        1. Nonce uniqueness (Replay check)
        2. Timestamp freshness (Window check)
        3. Verifier authorization (Access check)
        """
        # 1. Nonce check
        nonce_fresh = not self.nonce_registry.is_seen(nonce)
        
        # 2. Timestamp check
        ts_check = self.timestamp_registry.validate(timestamp, current_time)
        
        # 3. Verifier check
        verifier_authorized = self.verifier_registry.is_authorized(verifier_id)

        all_passed = nonce_fresh and ts_check["valid"] and verifier_authorized

        # If fresh, register nonce
        if nonce_fresh:
            self.nonce_registry.register(nonce, experiment_id, verifier_id)

        return {
            "passed": all_passed,
            "nonce_check": {
                "fresh": nonce_fresh,
                "replayed": not nonce_fresh,
                "nonce": nonce
            },
            "timestamp_check": ts_check,
            "verifier_check": {
                "authorized": verifier_authorized,
                "verifier_id": verifier_id
            }
        }
