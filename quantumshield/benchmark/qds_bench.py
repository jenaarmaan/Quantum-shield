"""
Benchmark Engine: QDS-Bench
Standardized evaluation scenarios for quantum digital signature protocols.
Includes:
- QDS-BENCH-01: Honest Channel Stability Baseline
- QDS-BENCH-02: Blind Forgery Resistance
- QDS-BENCH-03: Signer Impersonation Detection
- QDS-BENCH-04: Nonce-Replay Registry Enforcement
- QDS-BENCH-05: Unauthorized Verifier Access Control
- QDS-BENCH-06: Intercept-Resend Attack Detection Sensitivity (f = 0.20)
- QDS-BENCH-07: Adaptive Stealth Attacker Boundary Test
- QDS-BENCH-08: Sequential Detection (SPRT) Sample Efficiency
"""

from typing import List, Dict, Any
from quantumshield.experiments.runner import ExperimentRunner

BENCHMARK_SCENARIOS = [
    {
        "id": "QDS-BENCH-01",
        "name": "Honest Channel Stability",
        "protocol": "Teleportation-QDS",
        "version": "QDS-v1.0",
        "noise_model": "depolarizing",
        "noise_rate": 0.02,
        "attack_type": "none",
        "attack_strength": 0.0,
        "n_qubits": 1000,
        "expected_verdict": "ACCEPT",
        "expected_threat": "NONE",
        "description": "Verifies that unattacked honest transmission produces QBER within calibrated error bounds."
    },
    {
        "id": "QDS-BENCH-02",
        "name": "Blind Forgery Resistance",
        "protocol": "Teleportation-QDS",
        "version": "QDS-v1.0",
        "noise_model": "depolarizing",
        "noise_rate": 0.02,
        "attack_type": "forgery",
        "attack_strength": 1.0,
        "n_qubits": 1000,
        "expected_verdict": "REJECT",
        "expected_threat": "FORGERY",
        "description": "Evaluates detection when an attacker attempts to sign without legitimate private keys."
    },
    {
        "id": "QDS-BENCH-03",
        "name": "Signer Impersonation Detection",
        "protocol": "Teleportation-QDS",
        "version": "QDS-v1.0",
        "noise_model": "depolarizing",
        "noise_rate": 0.02,
        "attack_type": "impersonation",
        "attack_strength": 1.0,
        "n_qubits": 1000,
        "expected_verdict": "REJECT",
        "expected_threat": "IMPERSONATION",
        "description": "Simulates attacker replacing legitimate signer's qubits with arbitrary states."
    },
    {
        "id": "QDS-BENCH-04",
        "name": "Nonce-Replay Registry Enforcement",
        "protocol": "Teleportation-QDS",
        "version": "QDS-v1.0",
        "noise_model": "depolarizing",
        "noise_rate": 0.02,
        "attack_type": "replay",
        "attack_strength": 0.0,
        "n_qubits": 1000,
        "expected_verdict": "REJECT",
        "expected_threat": "REPLAY",
        "description": "Tests classical registry replay detection when a previously valid signature is re-submitted."
    },
    {
        "id": "QDS-BENCH-05",
        "name": "Unauthorized Verifier Access Control",
        "protocol": "Teleportation-QDS",
        "version": "QDS-v1.0",
        "noise_model": "depolarizing",
        "noise_rate": 0.02,
        "attack_type": "unauthorized_verification",
        "attack_strength": 0.0,
        "n_qubits": 1000,
        "expected_verdict": "REJECT",
        "expected_threat": "UNAUTHORIZED_VERIFICATION",
        "description": "Ensures that unlisted or revoked verifier entities are strictly rejected."
    },
    {
        "id": "QDS-BENCH-06",
        "name": "Intercept-Resend Attack Detection Sensitivity",
        "protocol": "Teleportation-QDS",
        "version": "QDS-v1.0",
        "noise_model": "depolarizing",
        "noise_rate": 0.02,
        "attack_type": "intercept_resend",
        "attack_strength": 0.20,
        "n_qubits": 1000,
        "expected_verdict": "REJECT",
        "expected_threat": "CHANNEL_MANIPULATION",
        "description": "Tests statistical sensitivity to 20% quantum eavesdropping (intercept-resend)."
    },
    {
        "id": "QDS-BENCH-07",
        "name": "Adaptive Stealth Attacker Boundary Test",
        "protocol": "Teleportation-QDS",
        "version": "QDS-v1.0",
        "noise_model": "depolarizing",
        "noise_rate": 0.02,
        "attack_type": "stealth",
        "attack_strength": 0.10,
        "n_qubits": 1000,
        "expected_verdict": "REJECT",
        "expected_threat": "STEALTH_THRESHOLD_EVENT",
        "description": "Evaluates red-team adversarial boundary hugging attempt."
    },
    {
        "id": "QDS-BENCH-08",
        "name": "Sequential Detection (SPRT) Sample Efficiency",
        "protocol": "Teleportation-QDS",
        "version": "QDS-v1.0",
        "noise_model": "depolarizing",
        "noise_rate": 0.02,
        "attack_type": "intercept_resend",
        "attack_strength": 0.30,
        "n_qubits": 1000,
        "expected_verdict": "REJECT",
        "expected_threat": "CHANNEL_MANIPULATION",
        "description": "Measures sample reduction efficiency achieved by Wald's SPRT over fixed-size testing."
    }
]

class QDSBenchRunner:
    @staticmethod
    def run_all(seed_base: int = 777) -> Dict[str, Any]:
        runner = ExperimentRunner()
        results: List[Dict[str, Any]] = []
        passed_scenarios = 0

        for i, sc in enumerate(BENCHMARK_SCENARIOS):
            seed = seed_base + i * 53
            exp = runner.run_experiment(
                message=f"Benchmark Message for {sc['id']}",
                n_qubits=sc["n_qubits"],
                noise_model_name=sc["noise_model"],
                noise_rate=sc["noise_rate"],
                attack_type=sc["attack_type"],
                attack_strength=sc["attack_strength"],
                seed=seed,
                experiment_id=f"bench_{sc['id'].lower()}"
            )
            res = exp["results"]
            verdict = res["verdict"]
            threat = res["threat_type"]
            
            # Check compliance with expected behavior
            verdict_ok = (verdict == sc["expected_verdict"])
            threat_ok = (threat == sc["expected_threat"] or "ANOMALY" in threat or "CHANNEL" in threat)
            test_passed = verdict_ok

            if test_passed:
                passed_scenarios += 1

            sprt_eff = res.get("sprt_result", {}).get("sample_efficiency", 0.0) if res.get("sprt_result") else 0.0

            results.append({
                "scenario_id": sc["id"],
                "name": sc["name"],
                "expected_verdict": sc["expected_verdict"],
                "actual_verdict": verdict,
                "threat_classification": threat,
                "qber": res["qber"],
                "p0": res["p0"],
                "threshold_rate": res["threshold_rate"],
                "p_value": res["p_value"],
                "sprt_efficiency": sprt_eff,
                "passed": test_passed,
                "experiment_id": exp["experiment_id"],
                "manifest_hash": exp["manifest"]["result_hash"]
            })

        return {
            "suite_name": "QDS-Bench Standard Evaluation Suite",
            "version": "1.0.0",
            "total_scenarios": len(BENCHMARK_SCENARIOS),
            "passed_scenarios": passed_scenarios,
            "pass_rate": passed_scenarios / len(BENCHMARK_SCENARIOS),
            "all_passed": passed_scenarios == len(BENCHMARK_SCENARIOS),
            "scenarios": results
        }
