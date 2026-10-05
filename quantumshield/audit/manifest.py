"""
Audit System: Experiment Manifest and Deterministic Reproducibility
Provides canonical JSON serializations, cryptographic configuration hashing, and verification.
"""

from typing import Dict, Any, Tuple
import hashlib
import json

def canonical_json_hash(data: Dict[str, Any]) -> str:
    """Produces SHA-256 hash of canonically sorted, whitespace-normalized JSON."""
    raw = json.dumps(data, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

class ExperimentManifest:
    @staticmethod
    def create(experiment_id: str, config: Dict[str, Any], results: Dict[str, Any],
               seed: int, software_version: str = "1.0.0",
               protocol_version: str = "QDS-v1.0",
               detector_version: str = "2.1.0") -> Dict[str, Any]:
        config_hash = canonical_json_hash(config)
        result_hash = canonical_json_hash(results)
        
        return {
            "manifest_version": "1.0.0",
            "experiment_id": experiment_id,
            "seed": seed,
            "software_version": software_version,
            "protocol_version": protocol_version,
            "detector_version": detector_version,
            "config_hash": config_hash,
            "result_hash": result_hash,
            "config": config,
            "results": results
        }

    @staticmethod
    def verify_reproduction(original_manifest: Dict[str, Any],
                            reproduced_results: Dict[str, Any]) -> Dict[str, Any]:
        """Compares reproduced results against original manifest hashes."""
        orig_res_hash = original_manifest["result_hash"]
        new_res_hash = canonical_json_hash(reproduced_results)

        is_match = (orig_res_hash == new_res_hash)
        diffs = []

        if not is_match:
            # Detect key differences
            orig = original_manifest.get("results", {})
            for k in set(orig.keys()).union(reproduced_results.keys()):
                if orig.get(k) != reproduced_results.get(k):
                    diffs.append({
                        "key": k,
                        "original": orig.get(k),
                        "reproduced": reproduced_results.get(k)
                    })

        return {
            "reproduction_status": "MATCH" if is_match else "MISMATCH",
            "original_result_hash": orig_res_hash,
            "reproduced_result_hash": new_res_hash,
            "differences": diffs
        }
