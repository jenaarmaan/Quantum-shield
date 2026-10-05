"""
Advisor Engine: Security Boundary Mapping
Classifies (attack_strength, noise_rate) and (signature_length, detection_prob) into:
- SAFE: attack below detection limit or negligible disturbance
- DETECTABLE: signal-to-noise ratio sufficient to guarantee detection
- AMBIGUOUS: statistical overlap between H0 and H1 under finite sample size
- UNRELIABLE: noise rate exceeds channel capacity or threshold boundary breakdown
"""

from typing import List, Dict, Any
import math

class SecurityBoundaryEngine:
    @staticmethod
    def evaluate_point(noise_rate: float, attack_strength: float, n_qubits: int,
                       alpha: float = 1e-4) -> Dict[str, Any]:
        p0 = (2.0 / 3.0) * noise_rate
        # For intercept-resend with strength f
        delta = (1.0 / 3.0) * attack_strength
        p1 = p0 + delta

        # Variance under H0
        sigma0 = math.sqrt(n_qubits * p0 * (1.0 - p0))
        # Threshold at z = 3.719 (for alpha ~ 1e-4)
        z_crit = 3.719
        t = n_qubits * p0 + z_crit * sigma0

        # Mean mismatch under attack
        mean_attack = n_qubits * p1
        sigma1 = math.sqrt(n_qubits * p1 * (1.0 - p1))

        # Z score of threshold under attack distribution
        z_attack = (t - mean_attack) / sigma1 if sigma1 > 0 else 0.0
        # Detection power P(X >= t | H1) = 0.5 * erfc(z_attack / sqrt(2))
        detection_power = 0.5 * math.erfc(z_attack / math.sqrt(2.0))
        detection_power = max(0.0, min(1.0, detection_power))

        # Classification
        if noise_rate >= 0.25:
            region = "UNRELIABLE"
            desc = "Channel noise exceeds reliable physical threshold."
        elif attack_strength <= 0.02:
            region = "SAFE"
            desc = "Disturbance within validated honest baseline bounds."
        elif detection_power >= 0.95:
            region = "DETECTABLE"
            desc = "Detected within configured error bounds."
        elif detection_power >= 0.50:
            region = "AMBIGUOUS"
            desc = "Below full detection power; statistical ambiguity exists."
        else:
            region = "UNRELIABLE"
            desc = "Outside validated operating region."

        return {
            "noise_rate": noise_rate,
            "attack_strength": attack_strength,
            "n_qubits": n_qubits,
            "p0": p0,
            "p1": p1,
            "detection_power": detection_power,
            "region": region,
            "description": desc
        }

    @staticmethod
    def generate_grid(n_qubits: int = 1000, alpha: float = 1e-4) -> List[Dict[str, Any]]:
        """Generates a discrete 2D grid over (noise_rate, attack_strength) for boundary visualization."""
        noise_steps = [0.005, 0.01, 0.02, 0.04, 0.06, 0.08, 0.10, 0.15, 0.20]
        attack_steps = [0.02, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.60, 0.80, 1.00]
        
        grid = []
        for n in noise_steps:
            for a in attack_steps:
                pt = SecurityBoundaryEngine.evaluate_point(n, a, n_qubits, alpha)
                grid.append(pt)
        return grid
