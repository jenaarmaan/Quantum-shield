"""
Audit System: Hash-Linked Immutable Audit Chain
Guarantees tamper-evidence for all experiment configurations, raw measurements, and verdicts.
Every record is cryptographically bound to the previous block hash via SHA-256.
"""

from typing import List, Dict, Any, Tuple, Optional
import hashlib
import json
import time

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class AuditRecord:
    def __init__(self, record_index: int, experiment_id: str,
                 config_hash: str, result_hash: str, previous_hash: str,
                 seed: int, software_version: str, protocol_version: str,
                 detector_version: str, timestamp: float, current_hash: Optional[str] = None):
        self.record_index = record_index
        self.experiment_id = experiment_id
        self.config_hash = config_hash
        self.result_hash = result_hash
        self.previous_hash = previous_hash
        self.seed = seed
        self.software_version = software_version
        self.protocol_version = protocol_version
        self.detector_version = detector_version
        self.timestamp = timestamp
        self.current_hash = current_hash or self.compute_hash()

    def compute_hash(self) -> str:
        payload = (
            f"{self.record_index}:{self.previous_hash}:{self.experiment_id}:"
            f"{self.config_hash}:{self.result_hash}:{self.seed}:"
            f"{self.software_version}:{self.protocol_version}:{self.detector_version}:"
            f"{self.timestamp:.6f}"
        )
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "record_index": self.record_index,
            "experiment_id": self.experiment_id,
            "config_hash": self.config_hash,
            "result_hash": self.result_hash,
            "previous_hash": self.previous_hash,
            "current_hash": self.current_hash,
            "seed": self.seed,
            "software_version": self.software_version,
            "protocol_version": self.protocol_version,
            "detector_version": self.detector_version,
            "timestamp": self.timestamp
        }


class AuditChain:
    def __init__(self):
        self.records: List[AuditRecord] = []

    def append_record(self, experiment_id: str, config_hash: str, result_hash: str,
                      seed: int, software_version: str = "1.0.0",
                      protocol_version: str = "QDS-v1.0",
                      detector_version: str = "2.1.0",
                      timestamp: Optional[float] = None) -> AuditRecord:
        prev_hash = self.records[-1].current_hash if self.records else GENESIS_HASH
        idx = len(self.records)
        ts = timestamp if timestamp is not None else time.time()
        
        record = AuditRecord(
            record_index=idx,
            experiment_id=experiment_id,
            config_hash=config_hash,
            result_hash=result_hash,
            previous_hash=prev_hash,
            seed=seed,
            software_version=software_version,
            protocol_version=protocol_version,
            detector_version=detector_version,
            timestamp=ts
        )
        self.records.append(record)
        return record

    def verify_audit_chain(self) -> Dict[str, Any]:
        """
        Verifies cryptographic integrity of the audit chain:
        1. Check genesis record links to GENESIS_HASH
        2. Verify previous_hash link for each consecutive block
        3. Verify current_hash matches recomputed SHA-256 payload
        Returns:
            {"status": "VALID" | "INVALID", "broken_index": None | int, "reason": str}
        """
        if not self.records:
            return {"status": "VALID", "total_records": 0, "broken_index": None}

        for i, rec in enumerate(self.records):
            # Check previous hash link
            expected_prev = GENESIS_HASH if i == 0 else self.records[i - 1].current_hash
            if rec.previous_hash != expected_prev:
                return {
                    "status": "INVALID",
                    "total_records": len(self.records),
                    "broken_index": i,
                    "reason": f"Previous hash mismatch at index {i}: expected {expected_prev}, found {rec.previous_hash}"
                }

            # Check hash integrity
            recomputed = rec.compute_hash()
            if rec.current_hash != recomputed:
                return {
                    "status": "INVALID",
                    "total_records": len(self.records),
                    "broken_index": i,
                    "reason": f"Block content tampered at index {i}: stored {rec.current_hash}, recomputed {recomputed}"
                }

        return {
            "status": "VALID",
            "total_records": len(self.records),
            "broken_index": None,
            "head_hash": self.records[-1].current_hash
        }
