# QUANTUMSHIELD ARCHITECTURAL SPECIFICATION

## System Purpose
QuantumShield is a deterministic, explainable, and reproducible quantum security evaluation and red-team platform for quantum digital-signature (QDS) protocols. It measures how secure a defined quantum digital-signature protocol remains under defined attacks and channel noise.

---

## 1. End-to-End Pipeline
```
USER INPUT (Message or File)
    ↓
SHA-256 HASH COMPUTATION
    ↓
QDS PROTOCOL ENGINE (ProtocolInterface)
    ↓
PAULI EIGENSTATE KEY GENERATION ({|0>, |1>, |+>, |->, |+i>, |-i>})
    ↓
BELL-PAIR GENERATION & ENTANGLEMENT (|Phi+> = 1/√2 (|00> + |11>))
    ↓
QUANTUM TELEPORTATION (Bell Measurement + Classical Feedforward)
    ↓
NOISY CHANNEL SIMULATION (Depolarizing / Bit-Flip / Phase-Flip)
    ↓
ATTACK INJECTION (Forgery, Impersonation, Replay, Unauthorized, Intercept-Resend, Stealth)
    ↓
PAULI CORRECTIONS (X^m2 Z^m1 applied by receiver Bob)
    ↓
PROJECTIVE MEASUREMENT (Born Rule in Alice's declared bases)
    ↓
QBER & MISMATCH COUNT (k mismatches / n qubits)
    ↓
STATISTICAL DETECTION (Exact Binomial Test + Wald SPRT + Z-Score)
    ↓
CLASSICAL REGISTRY CHECKS (Nonce Freshness, Timestamp Window, Verifier Access)
    ↓
DETERMINISTIC DECISION ENGINE (VERDICT: ACCEPT / REJECT)
    ↓
THREAT CLASSIFICATION (FORGERY, REPLAY, CHANNEL_MANIPULATION, etc.)
    ↓
STRUCTURED PLAIN-LANGUAGE EXPLANATION
    ↓
AUDIT CHAIN LOGGING (SHA-256 Hash-Linked Blocks)
    ↓
REPRODUCIBILITY & REPORT EXPORT (JSON, CSV, HTML, PDF-ready)
```

---

## 2. Invariants & Non-Negotiables
1. **Deterministic Decision Path**: The ACCEPT/REJECT verdict is strictly deterministic. AI, ML, LLMs, and heuristic models are categorically prohibited from determining verdicts.
2. **Explainer Separation**: The explanation layer is purely descriptive; it has zero write access to numerical metrics, thresholds, or verdicts.
3. **No Fabricated Numbers**: Unmeasured runs display "NOT YET MEASURED". All metrics stem from explicit simulation formulas or exact binomial evaluations.
4. **Reproducibility Contract**: Given the same configuration, protocol version, and random seed, the pipeline produces bitwise identical results.
