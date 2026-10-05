"""
Detection Engine: Wald's Sequential Probability Ratio Test (SPRT)
Hypotheses:
  H0: p = p0 (Honest channel noise)
  H1: p = p1 = p0 + delta (Attack disturbance present)

Log-Likelihood Ratio boundaries:
  A = ln((1 - beta) / alpha)    [Upper rejection boundary]
  B = ln(beta / (1 - alpha))    [Lower acceptance boundary]

For each observation x_i in {0, 1} (1 = mismatch, 0 = match):
  Delta LLR = x_i * ln(p1 / p0) + (1 - x_i) * ln((1 - p1) / (1 - p0))
"""

from typing import List, Dict, Any, Tuple
import math

class SPRTResult:
    __slots__ = ('verdict', 'samples_consumed', 'max_samples', 'final_llr',
                 'llr_trajectory', 'upper_boundary_A', 'lower_boundary_B',
                 'p0', 'p1', 'alpha', 'beta')

    def __init__(self, verdict: str, samples_consumed: int, max_samples: int,
                 final_llr: float, llr_trajectory: List[float],
                 upper_A: float, lower_B: float, p0: float, p1: float,
                 alpha: float, beta: float):
        self.verdict = verdict
        self.samples_consumed = samples_consumed
        self.max_samples = max_samples
        self.final_llr = final_llr
        self.llr_trajectory = llr_trajectory
        self.upper_boundary_A = upper_A
        self.lower_boundary_B = lower_B
        self.p0 = p0
        self.p1 = p1
        self.alpha = alpha
        self.beta = beta

    def to_dict(self) -> Dict[str, Any]:
        return {
            "verdict": self.verdict,
            "samples_consumed": self.samples_consumed,
            "max_samples": self.max_samples,
            "final_llr": self.final_llr,
            "llr_trajectory": self.llr_trajectory,
            "upper_boundary_A": self.upper_boundary_A,
            "lower_boundary_B": self.lower_boundary_B,
            "p0": self.p0,
            "p1": self.p1,
            "alpha": self.alpha,
            "beta": self.beta,
            "sample_efficiency": 1.0 - (self.samples_consumed / max(1, self.max_samples))
        }

def run_sprt(mismatch_stream: List[int], p0: float, p1: float,
             alpha: float = 1e-4, beta: float = 1e-4) -> SPRTResult:
    """
    Executes Wald's SPRT on sequential bit outcomes.
    mismatch_stream: list of 0 (match) and 1 (mismatch)
    """
    p0 = max(1e-6, min(1.0 - 1e-6, p0))
    p1 = max(p0 + 1e-6, min(1.0 - 1e-6, p1))
    alpha = max(1e-12, min(0.5, alpha))
    beta = max(1e-12, min(0.5, beta))

    upper_A = math.log((1.0 - beta) / alpha)
    lower_B = math.log(beta / (1.0 - alpha))

    # Log factors
    llr_mismatch = math.log(p1 / p0)
    llr_match = math.log((1.0 - p1) / (1.0 - p0))

    llr = 0.0
    trajectory: List[float] = [0.0]
    verdict = "INCONCLUSIVE"
    samples_consumed = 0

    for i, bit in enumerate(mismatch_stream):
        samples_consumed = i + 1
        delta = llr_mismatch if bit == 1 else llr_match
        llr += delta
        trajectory.append(llr)

        if llr >= upper_A:
            verdict = "REJECT"  # H1 favored: attack detected
            break
        elif llr <= lower_B:
            verdict = "ACCEPT"  # H0 favored: consistent with honest noise
            break

    if verdict == "INCONCLUSIVE":
        # Boundary reached at max samples
        verdict = "REJECT" if llr > 0 else "ACCEPT"

    return SPRTResult(
        verdict=verdict,
        samples_consumed=samples_consumed,
        max_samples=len(mismatch_stream),
        final_llr=llr,
        llr_trajectory=trajectory,
        upper_A=upper_A,
        lower_B=lower_B,
        p0=p0,
        p1=p1,
        alpha=alpha,
        beta=beta
    )
