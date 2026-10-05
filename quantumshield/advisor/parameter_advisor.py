"""
Advisor Engine: Security Parameter Advisor & Sample Size Estimation
Distinguishes strictly between theoretical analytical models and empirically validated measurements.

Sample size equation:
n = ((z_{1-alpha} * sqrt(p0*(1-p0)) + z_{1-beta} * sqrt(p1*(1-p1))) / (p1 - p0))^2
"""

from typing import Dict, Any
import math

def normal_quantile(p: float) -> float:
    """Rational approximation of inverse normal CDF (probit) by Beasley-Springer-Moro."""
    if p <= 0.0 or p >= 1.0:
        return 0.0
    if p < 0.5:
        # F^{-1}(p) = - G^{-1}(p)
        return -normal_quantile(1.0 - p)

    # For p in [0.5, 1.0)
    t = math.sqrt(-2.0 * math.log(1.0 - p))
    # Coefficients
    c0 = 2.515517
    c1 = 0.802853
    c2 = 0.010328
    d1 = 1.432788
    d2 = 0.189269
    d3 = 0.001308
    numerator = c0 + t * (c1 + t * c2)
    denominator = 1.0 + t * (d1 + t * (d2 + t * d3))
    return t - (numerator / denominator)

class ParameterAdvisor:
    @staticmethod
    def advise(noise_rate: float, target_far: float, target_frr: float,
               attack_strength: float = 0.20, noise_model: str = "depolarizing") -> Dict[str, Any]:
        """
        Computes recommended signature length n and threshold t for target error rates:
        - target_far: False Acceptance Rate (alpha, probability of accepting forged/attacked signature)
        - target_frr: False Rejection Rate (beta, probability of rejecting honest signature)
        """
        noise_rate = max(0.0001, min(0.40, noise_rate))
        target_far = max(1e-9, min(0.20, target_far))
        target_frr = max(1e-9, min(0.20, target_frr))
        attack_strength = max(0.01, min(1.0, attack_strength))

        # 1. Base honest mismatch rate p0
        p0 = (2.0 / 3.0) * noise_rate if noise_model == "depolarizing" else noise_rate
        p0 = max(0.0005, min(0.40, p0))

        # 2. Expected attack mismatch rate p1 (intercept-resend or forgery)
        # For intercept-resend: delta = (1/3) * f
        delta = (1.0 / 3.0) * attack_strength
        p1 = p0 + delta
        p1 = min(0.50, p1)

        # 3. Normal quantiles
        z_alpha = normal_quantile(1.0 - target_far)
        z_beta = normal_quantile(1.0 - target_frr)

        # 4. Required sample size n
        num = z_alpha * math.sqrt(p0 * (1.0 - p0)) + z_beta * math.sqrt(p1 * (1.0 - p1))
        denom = p1 - p0
        n_calc = math.ceil((num / denom) ** 2) if denom > 0 else 10000

        # Safety bounding
        n_recommended = max(64, min(200000, n_calc))

        # 5. Detection threshold
        threshold_count = math.ceil(n_recommended * p0 + z_alpha * math.sqrt(n_recommended * p0 * (1.0 - p0)))
        threshold_rate = threshold_count / n_recommended

        # 6. Feasibility assessment
        feasible = (n_recommended <= 50000) and (p1 > p0 * 1.25)
        operating_region = "DETECTABLE" if feasible else ("AMBIGUOUS" if n_recommended <= 100000 else "UNRELIABLE")

        return {
            "status": "THEORETICAL",
            "operating_region": operating_region,
            "feasible": feasible,
            "noise_rate": noise_rate,
            "p0_honest": p0,
            "p1_attack": p1,
            "delta_qber": delta,
            "target_far": target_far,
            "target_frr": target_frr,
            "recommended_n_qubits": n_recommended,
            "threshold_count": threshold_count,
            "threshold_rate": threshold_rate,
            "expected_far": target_far,
            "expected_frr": target_frr,
            "trade_offs": {
                "qubit_overhead": "High" if n_recommended > 5000 else ("Moderate" if n_recommended > 1000 else "Low"),
                "detection_power": f"{(1.0 - target_frr)*100:.2f}%",
                "notes": "Theoretical calculation based on asymptotic normal expansion. Empirical validation recommended via Experiment Runner."
            }
        }
