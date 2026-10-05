"""
Channel Engine: Honest Channel Calibration
Calibrates empirical mismatch probability p0 under unattacked noisy channel.
Computes Wilson score 95% confidence intervals and sample size metrics.
"""

from typing import Dict, Any
import math
import random
from quantumshield.channel.noise import NoiseModel
from quantumshield.core.states import get_pauli_state
from quantumshield.core.measurement import measure_state

def wilson_score_interval(k: int, n: int, confidence: float = 0.95) -> Dict[str, float]:
    """Calculates Wilson score confidence interval for binomial proportion."""
    if n <= 0:
        return {"p_hat": 0.0, "ci_lower": 0.0, "ci_upper": 0.0}
    
    p_hat = k / n
    # For 95% confidence, z ~ 1.95996
    z = 1.95996 if abs(confidence - 0.95) < 0.01 else 2.57583
    z2 = z * z
    denom = 1.0 + z2 / n
    center = (p_hat + z2 / (2.0 * n)) / denom
    margin = (z * math.sqrt((p_hat * (1.0 - p_hat) / n) + (z2 / (4.0 * n * n)))) / denom
    
    return {
        "p_hat": p_hat,
        "ci_lower": max(0.0, center - margin),
        "ci_upper": min(1.0, center + margin)
    }

def calibrate_channel(noise: NoiseModel, n_trials: int = 2000, seed: int = 42) -> Dict[str, Any]:
    """
    Runs calibration simulation to measure honest baseline mismatch probability p0.
    Uses random Pauli eigenstates across X, Y, Z bases.
    """
    rng = random.Random(seed)
    bases = ["X", "Y", "Z"]
    mismatches = 0

    for _ in range(n_trials):
        basis = rng.choice(bases)
        bit = rng.randint(0, 1)
        initial_state = get_pauli_state(basis, bit)
        
        # Pass through noisy channel
        noisy_state = noise.apply(initial_state, rng)
        
        # Measure in same basis
        measured_bit, _ = measure_state(noisy_state, basis, rng)
        if measured_bit != bit:
            mismatches += 1

    ci = wilson_score_interval(mismatches, n_trials, confidence=0.95)
    theoretical_p0 = noise.theoretical_p0()

    return {
        "noise_model": noise.model_type,
        "noise_rate": noise.rate,
        "sample_size": n_trials,
        "mismatches": mismatches,
        "p0_empirical": ci["p_hat"],
        "p0_theoretical": theoretical_p0,
        "ci_lower": ci["ci_lower"],
        "ci_upper": ci["ci_upper"],
        "seed": seed
    }
