"""
Detection Engine: Exact Binomial Hypothesis Testing
Computes the exact upper-tail cumulative probability:
P(X >= k | n, p0) = sum_{j=k}^n C(n, j) * p0^j * (1 - p0)^(n - j)
                 = I_{p0}(k, n - k + 1)
where I_x(a, b) is the regularized incomplete beta function.

Threshold calculation:
Finds the smallest integer threshold t such that P(X >= t | n, p0) <= alpha.
"""

import math
from typing import Dict, Any

def log_gamma(x: float) -> float:
    """Lanczos approximation for ln(Gamma(x))."""
    return math.lgamma(x)

def betainc(a: float, b: float, x: float) -> float:
    """
    Regularized incomplete beta function I_x(a, b) using continued fractions.
    Evaluated with Lentz's method.
    """
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0

    # Symmetry transformation for rapid convergence
    if x > (a + 1.0) / (a + b + 2.0):
        return 1.0 - betainc(b, a, 1.0 - x)

    # Front factor: exp(ln(x^a * (1-x)^b / B(a, b))) / a
    ln_beta = log_gamma(a) + log_gamma(b) - log_gamma(a + b)
    front = math.exp(a * math.log(x) + b * math.log(1.0 - x) - ln_beta) / a

    # Lentz's continued fraction method
    tiny = 1e-30
    c = 1.0
    d = 1.0 - (a + b) * x / (a + 1.0)
    if abs(d) < tiny:
        d = tiny
    d = 1.0 / d
    f = d

    max_iter = 300
    for m in range(1, max_iter + 1):
        m2 = 2 * m
        # Even step 2m
        num_even = (m * (b - m) * x) / ((a + m2 - 1.0) * (a + m2))
        d = 1.0 + num_even * d
        if abs(d) < tiny:
            d = tiny
        c = 1.0 + num_even / c
        if abs(c) < tiny:
            c = tiny
        d = 1.0 / d
        f *= (c * d)

        # Odd step 2m + 1
        num_odd = -((a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1.0))
        d = 1.0 + num_odd * d
        if abs(d) < tiny:
            d = tiny
        c = 1.0 + num_odd / c
        if abs(c) < tiny:
            c = tiny
        d = 1.0 / d
        f *= (c * d)

        if abs(c * d - 1.0) < 1e-15:
            break

    return front * f

def exact_binomial_tail(k: int, n: int, p0: float) -> float:
    """
    Computes exact P(X >= k | n, p0).
    Boundary conditions:
    - If k <= 0: P(X >= 0) = 1.0
    - If k > n: P(X >= n + 1) = 0.0
    - If p0 == 0: 0.0 if k > 0 else 1.0
    - If p0 == 1: 1.0 if k <= n else 0.0
    """
    if k <= 0:
        return 1.0
    if k > n:
        return 0.0
    if p0 <= 0.0:
        return 0.0
    if p0 >= 1.0:
        return 1.0

    # Identity: sum_{j=k}^n binom(n, j) p^j (1-p)^(n-j) = I_p(k, n - k + 1)
    a = float(k)
    b = float(n - k + 1)
    tail_prob = betainc(a, b, p0)
    return max(0.0, min(1.0, tail_prob))

def compute_binomial_threshold(n: int, p0: float, alpha: float) -> int:
    """
    Finds the minimum integer threshold t in [0, n + 1] such that:
    P(X >= t | n, p0) <= alpha
    Uses binary search over [0, n + 1].
    """
    if p0 <= 0.0:
        return 1
    if alpha >= 1.0:
        return 0

    low = 0
    high = n + 1
    threshold = n + 1

    while low <= high:
        mid = (low + high) // 2
        p_val = exact_binomial_tail(mid, n, p0)
        if p_val <= alpha:
            threshold = mid
            high = mid - 1
        else:
            low = mid + 1

    return threshold
