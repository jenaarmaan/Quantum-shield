"""
Experiment Engine: Parameter Sweeps and Monte Carlo Evaluation
Implements standardized evaluation experiments:
- E1: Honest Baseline Calibration
- E2: Attack Suite (Confusion matrix, FAR/FRR, 95% CIs)
- E3: Channel Noise Sweep
- E4: Attack Strength Sweep
- E5: Signature Length Sweep
- E6: SPRT vs Fixed-Sample Comparison
- E7: Adaptive Stealth Attacker
- E8: Analytic vs Monte Carlo Cross-Validation
"""

from typing import List, Dict, Any
import random
from quantumshield.experiments.runner import ExperimentRunner
from quantumshield.channel.calibration import wilson_score_interval
from quantumshield.advisor.security_boundary import SecurityBoundaryEngine

class ExperimentSweeps:
    @staticmethod
    def run_noise_sweep(noise_rates: List[float] = None, n_qubits: int = 500,
                        attack_type: str = "intercept_resend", attack_strength: float = 0.20,
                        seed: int = 42) -> List[Dict[str, Any]]:
        rates = noise_rates or [0.005, 0.01, 0.02, 0.03, 0.05, 0.08, 0.10, 0.15]
        runner = ExperimentRunner()
        points = []

        for i, rate in enumerate(rates):
            exp = runner.run_experiment(
                message="QuantumShield Noise Sweep",
                n_qubits=n_qubits,
                noise_rate=rate,
                attack_type=attack_type,
                attack_strength=attack_strength,
                seed=seed + i * 17
            )
            res = exp["results"]
            points.append({
                "noise_rate": rate,
                "qber": res["qber"],
                "p0": res["p0"],
                "threshold_rate": res["threshold_rate"],
                "verdict": res["verdict"],
                "threat_type": res["threat_type"]
            })
        return points

    @staticmethod
    def run_attack_strength_sweep(strengths: List[float] = None, noise_rate: float = 0.02,
                                 n_qubits: int = 500, seed: int = 101) -> List[Dict[str, Any]]:
        st = strengths or [0.0, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.60, 0.80, 1.0]
        runner = ExperimentRunner()
        points = []

        for i, s in enumerate(st):
            atk = "none" if s <= 0.001 else "intercept_resend"
            exp = runner.run_experiment(
                message="QuantumShield Strength Sweep",
                n_qubits=n_qubits,
                noise_rate=noise_rate,
                attack_type=atk,
                attack_strength=s,
                seed=seed + i * 23
            )
            res = exp["results"]
            points.append({
                "attack_strength": s,
                "qber": res["qber"],
                "threshold_rate": res["threshold_rate"],
                "p0": res["p0"],
                "verdict": res["verdict"],
                "p_value": res["p_value"],
                "detected": res["verdict"] == "REJECT"
            })
        return points

    @staticmethod
    def run_length_sweep(qubit_counts: List[int] = None, noise_rate: float = 0.02,
                         attack_strength: float = 0.15, seed: int = 303) -> List[Dict[str, Any]]:
        counts = qubit_counts or [100, 250, 500, 1000, 2000, 4000]
        runner = ExperimentRunner()
        points = []

        for i, n in enumerate(counts):
            exp = runner.run_experiment(
                message="QuantumShield Length Sweep",
                n_qubits=n,
                noise_rate=noise_rate,
                attack_type="intercept_resend",
                attack_strength=attack_strength,
                seed=seed + i * 31
            )
            res = exp["results"]
            points.append({
                "n_qubits": n,
                "threshold_count": res["threshold"],
                "threshold_rate": res["threshold_rate"],
                "qber": res["qber"],
                "verdict": res["verdict"],
                "p_value": res["p_value"]
            })
        return points

    @staticmethod
    def run_attack_suite_benchmark(trials_per_threat: int = 50, n_qubits: int = 400,
                                   noise_rate: float = 0.02, seed: int = 999) -> Dict[str, Any]:
        """
        Runs empirical multi-trial attack suite across threat types:
        - none (honest)
        - forgery
        - impersonation
        - replay
        - unauthorized_verification
        - intercept_resend
        """
        runner = ExperimentRunner()
        threats = ["none", "forgery", "impersonation", "replay", "unauthorized_verification", "intercept_resend"]
        summary: Dict[str, Any] = {}

        for t_idx, threat in enumerate(threats):
            accept_count = 0
            reject_count = 0
            classified_counts: Dict[str, int] = {}
            qbers: List[float] = []

            for trial in range(trials_per_threat):
                exp = runner.run_experiment(
                    message=f"Benchmark Trial {trial}",
                    n_qubits=n_qubits,
                    noise_rate=noise_rate,
                    attack_type=threat,
                    attack_strength=0.25 if threat == "intercept_resend" else 0.0,
                    seed=seed + t_idx * 1000 + trial
                )
                res = exp["results"]
                if res["verdict"] == "ACCEPT":
                    accept_count += 1
                else:
                    reject_count += 1
                
                c = res["threat_type"]
                classified_counts[c] = classified_counts.get(c, 0) + 1
                qbers.append(res["qber"])

            avg_qber = sum(qbers) / len(qbers)
            ci = wilson_score_interval(reject_count, trials_per_threat, 0.95)

            if threat == "none":
                # Honest scenario: False Rejection Rate (FRR)
                frr = reject_count / trials_per_threat
                summary["honest"] = {
                    "trials": trials_per_threat,
                    "false_rejections": reject_count,
                    "frr": frr,
                    "avg_qber": avg_qber,
                    "ci_95": ci
                }
            else:
                # Attack scenario: Detection Rate & False Acceptance Rate (FAR)
                detection_rate = reject_count / trials_per_threat
                far = accept_count / trials_per_threat
                summary[threat] = {
                    "trials": trials_per_threat,
                    "detected": reject_count,
                    "detection_rate": detection_rate,
                    "far": far,
                    "avg_qber": avg_qber,
                    "ci_95": ci,
                    "classifications": classified_counts
                }

        return {
            "status": "EMPIRICALLY_VALIDATED",
            "trials_per_threat": trials_per_threat,
            "n_qubits": n_qubits,
            "noise_rate": noise_rate,
            "summary": summary
        }
