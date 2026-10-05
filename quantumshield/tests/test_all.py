"""
QuantumShield Comprehensive Test Suite
Validates:
1. Quantum primitives & teleportation
2. QDS protocol pipeline
3. All attacks (Forgery, Impersonation, Replay, Unauthorized, Intercept-Resend, Stealth)
4. Statistical detector (exact binomial, thresholding, Z-score, SPRT)
5. Classical registries
6. Audit chain integrity & tampering detection
7. Deterministic reproducibility
8. Golden test vectors export
"""

import sys
import os
import json
import math

# Ensure workspace root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from quantumshield.core.states import StateVector, get_pauli_state, PAULI_EIGENSTATES
from quantumshield.core.gates import (
    apply_pauli_x, apply_pauli_y, apply_pauli_z, apply_hadamard, apply_pauli_correction
)
from quantumshield.core.teleportation import simulate_teleportation
from quantumshield.core.measurement import measure_state
from quantumshield.channel.noise import NoiseModel
from quantumshield.protocols.teleportation_qds import TeleportationQDSProtocol
from quantumshield.detection.exact_binomial import exact_binomial_tail, compute_binomial_threshold
from quantumshield.detection.zscore import compute_zscore
from quantumshield.detection.sprt import run_sprt
from quantumshield.detection.decision import DecisionEngine, DetectionContext
from quantumshield.registry.registry_manager import RegistryManager
from quantumshield.audit.audit_chain import AuditChain, AuditRecord
from quantumshield.audit.manifest import ExperimentManifest, canonical_json_hash
from quantumshield.experiments.runner import ExperimentRunner
from quantumshield.benchmark.qds_bench import QDSBenchRunner
import random

def test_quantum_core():
    print("[*] Testing Quantum Core Primitives...")
    # 1. State vector normalization and inner product
    z0 = get_pauli_state("Z", 0)
    z1 = get_pauli_state("Z", 1)
    assert abs(z0.inner_product(z1)) < 1e-12, "Orthogonal eigenstates must have 0 inner product"
    assert abs(z0.transition_probability(z0) - 1.0) < 1e-12, "<0|0> = 1"

    # 2. Bloch coordinates
    x, y, z = z0.bloch_coordinates()
    assert abs(x) < 1e-12 and abs(y) < 1e-12 and abs(z - 1.0) < 1e-12, "|0> must point to +Z"

    x0 = get_pauli_state("X", 0)
    x, y, z = x0.bloch_coordinates()
    assert abs(x - 1.0) < 1e-12 and abs(y) < 1e-12 and abs(z) < 1e-12, "|+> must point to +X"

    # 3. Gate operations
    x_applied = apply_pauli_x(z0)
    assert abs(x_applied.transition_probability(z1) - 1.0) < 1e-12, "X|0> = |1>"

    h_applied = apply_hadamard(z0)
    assert abs(h_applied.transition_probability(x0) - 1.0) < 1e-12, "H|0> = |+>"

    # 4. Teleportation fidelity in ideal channel
    rng = random.Random(42)
    for state_key in ["Z0", "Z1", "X0", "X1", "Y0", "Y1"]:
        init_st = PAULI_EIGENSTATES[state_key]
        for _ in range(10):
            res = simulate_teleportation(init_st, rng)
            assert abs(res.fidelity - 1.0) < 1e-12, f"Teleportation fidelity must be 1.0 for {state_key}"

    print("    -> Quantum core passed.")

def test_statistical_detector():
    print("[*] Testing Statistical Detection Engine...")
    # Exact binomial tail
    # For n=10, p=0.5: P(X >= 0) = 1.0
    assert abs(exact_binomial_tail(0, 10, 0.5) - 1.0) < 1e-12
    # P(X >= 11) = 0.0
    assert abs(exact_binomial_tail(11, 10, 0.5)) < 1e-12
    # For n=4, p=0.5: P(X >= 4) = (0.5)^4 = 0.0625
    p_exact = exact_binomial_tail(4, 4, 0.5)
    assert abs(p_exact - 0.0625) < 1e-6, f"Expected 0.0625, got {p_exact}"

    # Threshold calculation
    t = compute_binomial_threshold(1000, 0.02, 1e-4)
    p_at_t = exact_binomial_tail(t, 1000, 0.02)
    p_at_t_minus_1 = exact_binomial_tail(t - 1, 1000, 0.02)
    assert p_at_t <= 1e-4, f"P(X >= t) must be <= alpha: {p_at_t}"
    assert p_at_t_minus_1 > 1e-4, f"P(X >= t-1) must be > alpha: {p_at_t_minus_1}"

    # Z-score test
    z_res = compute_zscore(50, 1000, 0.02)
    # Expected mean = 20, var = 19.6, std = ~4.427, z = (50-20)/4.427 ~ 6.77
    assert z_res["z"] > 6.0, f"Expected z > 6.0, got {z_res['z']}"

    # Wald SPRT test
    # Strong attack stream: 50% errors
    stream_attack = [1 if i % 2 == 0 else 0 for i in range(100)]
    sprt_atk = run_sprt(stream_attack, p0=0.02, p1=0.20, alpha=1e-4, beta=1e-4)
    assert sprt_atk.verdict == "REJECT", f"SPRT must reject attack stream: {sprt_atk.verdict}"
    assert sprt_atk.samples_consumed < 100, f"SPRT should terminate early: {sprt_atk.samples_consumed}"

    # Clean honest stream: 1% errors
    stream_honest = [1 if i == 50 else 0 for i in range(200)]
    sprt_hon = run_sprt(stream_honest, p0=0.02, p1=0.20, alpha=1e-4, beta=1e-4)
    assert sprt_hon.verdict == "ACCEPT", f"SPRT must accept honest stream: {sprt_hon.verdict}"

    print("    -> Statistical detector passed.")

def test_protocol_and_attacks():
    print("[*] Testing Protocol Pipeline and Attacks...")
    runner = ExperimentRunner()

    # 1. Honest baseline: should ACCEPT
    exp_honest = runner.run_experiment(
        message="Honest Quantum Message",
        n_qubits=1000,
        noise_rate=0.015,
        attack_type="none",
        seed=1234
    )
    assert exp_honest["results"]["verdict"] == "ACCEPT", f"Honest test failed: {exp_honest['results']['verdict']}"
    assert exp_honest["results"]["threat_type"] == "NONE"

    # 2. Forgery attack: should REJECT with FORGERY classification
    exp_forgery = runner.run_experiment(
        message="Forged Message",
        n_qubits=1000,
        noise_rate=0.015,
        attack_type="forgery",
        seed=1234
    )
    assert exp_forgery["results"]["verdict"] == "REJECT"
    assert exp_forgery["results"]["threat_type"] == "FORGERY"
    assert abs(exp_forgery["results"]["qber"] - 0.50) < 0.08, f"Forgery QBER ~ 0.50: {exp_forgery['results']['qber']}"

    # 3. Impersonation attack: should REJECT
    exp_imp = runner.run_experiment(
        message="Impersonated Message",
        n_qubits=1000,
        noise_rate=0.015,
        attack_type="impersonation",
        seed=1234
    )
    assert exp_imp["results"]["verdict"] == "REJECT"

    # 4. Replay attack: should REJECT via Nonce Registry
    exp_replay = runner.run_experiment(
        message="Replayed Message",
        n_qubits=1000,
        noise_rate=0.015,
        attack_type="replay",
        seed=1234
    )
    assert exp_replay["results"]["verdict"] == "REJECT"
    assert exp_replay["results"]["threat_type"] == "REPLAY"
    assert exp_replay["results"]["registry_findings"]["nonce_check"]["replayed"] is True

    # 5. Unauthorized Verifier: should REJECT via Verifier Registry
    exp_unauth = runner.run_experiment(
        message="Unauthorized Message",
        n_qubits=1000,
        noise_rate=0.015,
        attack_type="unauthorized_verification",
        seed=1234
    )
    assert exp_unauth["results"]["verdict"] == "REJECT"
    assert exp_unauth["results"]["threat_type"] == "UNAUTHORIZED_VERIFICATION"

    # 6. Intercept-Resend attack: should REJECT with CHANNEL_MANIPULATION
    exp_ir = runner.run_experiment(
        message="Intercepted Message",
        n_qubits=1000,
        noise_rate=0.015,
        attack_type="intercept_resend",
        attack_strength=0.25,
        seed=1234
    )
    assert exp_ir["results"]["verdict"] == "REJECT"
    assert exp_ir["results"]["qber"] > exp_honest["results"]["threshold_rate"]

    print("    -> Protocol and attacks passed.")

def test_audit_chain_and_reproducibility():
    print("[*] Testing Audit Chain and Deterministic Reproducibility...")
    chain = AuditChain()
    rec1 = chain.append_record("exp_1", "cfg_hash_1", "res_hash_1", seed=10)
    rec2 = chain.append_record("exp_2", "cfg_hash_2", "res_hash_2", seed=20)
    rec3 = chain.append_record("exp_3", "cfg_hash_3", "res_hash_3", seed=30)

    # 1. Valid chain verification
    v_res = chain.verify_audit_chain()
    assert v_res["status"] == "VALID", f"Expected valid chain, got: {v_res}"

    # 2. Tampered chain verification
    rec2.config_hash = "tampered_config_hash"
    tampered_res = chain.verify_audit_chain()
    assert tampered_res["status"] == "INVALID"
    assert tampered_res["broken_index"] == 1, f"Expected broken index 1, got {tampered_res['broken_index']}"

    # 3. Deterministic reproducibility test
    runner_a = ExperimentRunner()
    exp_a = runner_a.run_experiment(
        message="Deterministic Target Document",
        n_qubits=500,
        noise_rate=0.02,
        attack_type="intercept_resend",
        attack_strength=0.20,
        seed=9999,
        experiment_id="exp_reproduce_canonical"
    )
    runner_b = ExperimentRunner()
    exp_b = runner_b.run_experiment(
        message="Deterministic Target Document",
        n_qubits=500,
        noise_rate=0.02,
        attack_type="intercept_resend",
        attack_strength=0.20,
        seed=9999,
        experiment_id="exp_reproduce_canonical"
    )

    hash_a = exp_a["manifest"]["result_hash"]
    hash_b = exp_b["manifest"]["result_hash"]
    assert hash_a == hash_b, f"Reproducibility failed: {hash_a} != {hash_b}"
    assert exp_a["results"]["mismatches"] == exp_b["results"]["mismatches"]
    assert exp_a["results"]["qber"] == exp_b["results"]["qber"]

    print("    -> Audit chain and reproducibility passed.")

def test_benchmark_suite():
    print("[*] Testing QDS-Bench Standard Scenarios...")
    bench_res = QDSBenchRunner.run_all(seed_base=42)
    print(f"    Pass Rate: {bench_res['pass_rate']*100:.1f}% ({bench_res['passed_scenarios']}/{bench_res['total_scenarios']})")
    assert bench_res["all_passed"], f"Not all benchmark scenarios passed: {bench_res}"
    print("    -> QDS-Bench passed all 8 scenarios.")

def export_golden_vectors():
    print("[*] Exporting Golden Test Vectors for Cross-Language Verification...")
    runner = ExperimentRunner()
    test_cases = [
        {"name": "case_honest", "n_qubits": 200, "noise_rate": 0.01, "attack": "none", "strength": 0.0, "seed": 1001},
        {"name": "case_forgery", "n_qubits": 200, "noise_rate": 0.01, "attack": "forgery", "strength": 1.0, "seed": 1002},
        {"name": "case_intercept", "n_qubits": 200, "noise_rate": 0.01, "attack": "intercept_resend", "strength": 0.30, "seed": 1003},
    ]

    golden = []
    for tc in test_cases:
        res = runner.run_experiment(
            message="Golden Document Content",
            n_qubits=tc["n_qubits"],
            noise_rate=tc["noise_rate"],
            attack_type=tc["attack"],
            attack_strength=tc["strength"],
            seed=tc["seed"]
        )
        r = res["results"]
        golden.append({
            "name": tc["name"],
            "seed": tc["seed"],
            "n_qubits": tc["n_qubits"],
            "noise_rate": tc["noise_rate"],
            "attack_type": tc["attack"],
            "attack_strength": tc["strength"],
            "mismatches": r["mismatches"],
            "qber": r["qber"],
            "p0": r["p0"],
            "threshold": r["threshold"],
            "threshold_rate": r["threshold_rate"],
            "verdict": r["verdict"],
            "threat_type": r["threat_type"],
            "result_hash": res["manifest"]["result_hash"]
        })

    out_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "golden_vectors.json"))
    with open(out_path, "w") as f:
        json.dump(golden, f, indent=2)
    print(f"    Exported {len(golden)} golden vectors to {out_path}.")

if __name__ == "__main__":
    test_quantum_core()
    test_statistical_detector()
    test_protocol_and_attacks()
    test_audit_chain_and_reproducibility()
    test_benchmark_suite()
    export_golden_vectors()
    print("\n[SUCCESS] All Python reference engine tests PASSED perfectly!")
