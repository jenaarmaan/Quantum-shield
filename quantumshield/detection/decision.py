"""
Detection Engine: Central Deterministic Decision Engine
Core invariant:
The accept/reject decision cannot depend on LLMs, generative AI, or machine learning.
The decision is strictly determined by:
- Measured quantum mismatch data (QBER)
- Exact statistical test (exact binomial tail probability <= alpha)
- Classical registry checks (nonce freshness, timestamp window, verifier auth)
"""

from typing import Dict, Any, List, Optional
from quantumshield.detection.exact_binomial import exact_binomial_tail, compute_binomial_threshold
from quantumshield.detection.zscore import compute_zscore
from quantumshield.detection.sprt import run_sprt, SPRTResult
from quantumshield.detection.classifier import ThreatClassifier
from quantumshield.channel.calibration import wilson_score_interval

class DetectionContext:
    def __init__(self, mismatches: int, n_qubits: int, p0: float, alpha: float = 1e-4,
                 beta: float = 1e-4, registry_res: Optional[Dict[str, Any]] = None,
                 mismatch_stream: Optional[List[int]] = None,
                 attack_hint: str = "none", experiment_id: str = "exp_0"):
        self.mismatches = mismatches
        self.n_qubits = n_qubits
        self.p0 = p0
        self.alpha = alpha
        self.beta = beta
        self.registry_res = registry_res or {
            "passed": True,
            "nonce_check": {"fresh": True, "replayed": False},
            "timestamp_check": {"valid": True},
            "verifier_check": {"authorized": True}
        }
        self.mismatch_stream = mismatch_stream
        self.attack_hint = attack_hint
        self.experiment_id = experiment_id

class DecisionResult:
    def __init__(self, verdict: str, threat_type: str, qber: float, mismatches: int,
                 n_qubits: int, p0: float, threshold: int, threshold_rate: float,
                 p_value: float, zscore: Dict[str, Any], registry_findings: Dict[str, Any],
                 ci_95: Dict[str, float], explanation: str,
                 sprt_result: Optional[Dict[str, Any]] = None,
                 experiment_id: str = ""):
        self.verdict = verdict
        self.threat_type = threat_type
        self.qber = qber
        self.mismatches = mismatches
        self.n_qubits = n_qubits
        self.p0 = p0
        self.threshold = threshold
        self.threshold_rate = threshold_rate
        self.p_value = p_value
        self.zscore = zscore
        self.registry_findings = registry_findings
        self.ci_95 = ci_95
        self.explanation = explanation
        self.sprt_result = sprt_result
        self.experiment_id = experiment_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "verdict": self.verdict,
            "threat_type": self.threat_type,
            "qber": self.qber,
            "mismatches": self.mismatches,
            "n_qubits": self.n_qubits,
            "p0": self.p0,
            "threshold": self.threshold,
            "threshold_rate": self.threshold_rate,
            "p_value": self.p_value,
            "zscore": self.zscore,
            "registry_findings": self.registry_findings,
            "ci_95": self.ci_95,
            "explanation": self.explanation,
            "sprt_result": self.sprt_result,
            "experiment_id": self.experiment_id
        }

class DecisionEngine:
    @staticmethod
    def evaluate(context: DetectionContext) -> DecisionResult:
        n = max(1, context.n_qubits)
        k = context.mismatches
        p0 = context.p0
        alpha = context.alpha
        qber = k / n

        # 1. Exact Binomial Threshold & P-value
        threshold = compute_binomial_threshold(n, p0, alpha)
        threshold_rate = threshold / n
        p_value = exact_binomial_tail(k, n, p0)

        # 2. Z-Score calculation
        z_res = compute_zscore(k, n, p0)

        # 3. 95% Wilson Score Confidence Interval
        ci = wilson_score_interval(k, n, 0.95)

        # 4. Classical Registry checks
        reg = context.registry_res
        registry_passed = reg.get("passed", True)

        # 5. SPRT (if mismatch stream provided)
        sprt_dict = None
        sprt_reject = False
        if context.mismatch_stream and len(context.mismatch_stream) > 0:
            # delta = difference between expected attack QBER (or threshold) and p0
            p1 = max(p0 + 0.05, threshold_rate)
            sprt_res = run_sprt(context.mismatch_stream, p0, p1, alpha, context.beta)
            sprt_dict = sprt_res.to_dict()
            if sprt_res.verdict == "REJECT":
                sprt_reject = True

        # 6. Deterministic Verdict
        # Signature is REJECTED if:
        # - Any classical registry check failed (replay, expired timestamp, unauthorized verifier)
        # - OR quantum mismatch count >= threshold (exact test p <= alpha)
        # - OR SPRT indicates reject
        is_quantum_rejected = (k >= threshold) or (p_value <= alpha) or sprt_reject
        
        if not registry_passed or is_quantum_rejected:
            verdict = "REJECT"
        else:
            verdict = "ACCEPT"

        # 7. Threat Classification
        threat_type = ThreatClassifier.classify(
            registry_res=reg,
            qber=qber,
            p0=p0,
            threshold_rate=threshold_rate,
            attack_hint=context.attack_hint
        )
        if verdict == "ACCEPT":
            threat_type = "NONE"

        # 8. Deterministic Plain Language Explanation
        explanation = DecisionEngine._build_explanation(
            verdict=verdict,
            threat_type=threat_type,
            qber=qber,
            p0=p0,
            threshold_rate=threshold_rate,
            mismatches=k,
            threshold=threshold,
            p_value=p_value,
            reg=reg
        )

        return DecisionResult(
            verdict=verdict,
            threat_type=threat_type,
            qber=qber,
            mismatches=k,
            n_qubits=n,
            p0=p0,
            threshold=threshold,
            threshold_rate=threshold_rate,
            p_value=p_value,
            zscore=z_res,
            registry_findings=reg,
            ci_95=ci,
            explanation=explanation,
            sprt_result=sprt_dict,
            experiment_id=context.experiment_id
        )

    @staticmethod
    def _build_explanation(verdict: str, threat_type: str, qber: float, p0: float,
                           threshold_rate: float, mismatches: int, threshold: int,
                           p_value: float, reg: Dict[str, Any]) -> str:
        if not reg.get("nonce_check", {}).get("fresh", True):
            return "Signature rejected: Nonce has already been registered in the audit registry. Replay attempt detected."
        if not reg.get("verifier_check", {}).get("authorized", True):
            return "Signature rejected: Verifier identity is not present or authorized in the verifier registry."
        if not reg.get("timestamp_check", {}).get("valid", True):
            return "Signature rejected: Signature timestamp falls outside the configured acceptable temporal window."

        if verdict == "REJECT":
            return (
                f"Signature rejected because observed mismatch rate ({qber*100:.2f}%, {mismatches} mismatches) "
                f"exceeded the calibrated honest threshold ({threshold_rate*100:.2f}%, {threshold} max allowed) "
                f"with statistical significance p = {p_value:.2e} under exact binomial testing. "
                f"Classified as {threat_type}."
            )
        else:
            return (
                f"Signature accepted: Observed quantum bit error rate ({qber*100:.2f}%) remained within "
                f"the calibrated honest baseline ({p0*100:.2f}%) and below the detection threshold "
                f"({threshold_rate*100:.2f}%). All classical nonces, timestamps, and verifier permissions verified."
            )
