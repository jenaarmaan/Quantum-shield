"""
Detection Engine: Z-Score Calculation
Standardized mismatch score:
z = (k - n * p0) / sqrt(n * p0 * (1 - p0))
Provides an interpretable secondary metric for scientific reporting.
"""

import math
from typing import Dict, Any

def compute_zscore(k: int, n: int, p0: float) -> Dict[str, Any]:
    if n <= 0 or p0 <= 0.0 or p0 >= 1.0:
        return {"z": 0.0, "p_value_approx": 1.0, "mean": 0.0, "std_dev": 0.0}

    mean = n * p0
    variance = n * p0 * (1.0 - p0)
    std_dev = math.sqrt(variance)

    z = (k - mean) / std_dev if std_dev > 0.0 else 0.0

    # Upper tail normal approximation 1 - Phi(z) = 0.5 * erfc(z / sqrt(2))
    p_approx = 0.5 * math.erfc(z / math.sqrt(2.0))

    return {
        "z": z,
        "p_value_approx": max(0.0, min(1.0, p_approx)),
        "expected_mean": mean,
        "std_dev": std_dev
    }
