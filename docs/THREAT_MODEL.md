# QUANTUMSHIELD THREAT MODEL & ATTACK TAXONOMY

## 1. Threat Scenarios
| Threat Name | Primary Target | Adversary Capability | Detection Vector | Expected QBER Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Blind Forgery** | Document / Key binding | Signs without private keys; guesses bases | Projective basis measurements | $\approx 50.0\%$ |
| **Signer Impersonation** | Entity Identity | Replaces legitimate Alice with substitute states | Quantum state correlation failure | $\approx 50.0\%$ |
| **Cryptographic Replay** | Session Uniqueness | Replays valid captured signature packet | Classical Nonce & Timestamp Registries | None ($\approx p_0$), caught by Nonce check |
| **Unauthorized Verifier**| Access Authorization | Unlisted node attempts verification | Verifier Access Control Registry | Blocked before quantum verification |
| **Intercept-Resend** | Confidentiality / Integrity | Measures fraction $f$ of carrier qubits and resends | Quantum collapse perturbation | $+ \frac{1}{3}f$ excess QBER |
| **Adaptive Stealth** | Boundary Evasion | Tunes attack strength $f$ to remain beneath threshold | Finite-sample statistical tail / SPRT | Boundary hugging ($\approx t$) |

---

## 2. Decision Engine Threat Classification Matrix
1. **Classical Registry Rule**: Nonce reused $\implies$ `REPLAY`.
2. **Access Control Rule**: Unregistered verifier ID $\implies$ `UNAUTHORIZED_VERIFICATION`.
3. **Timestamp Skew Rule**: $|T - T_{\text{now}}| > \Delta T_{\max} \implies$ `REPLAY` (Expired temporal packet).
4. **Quantum Statistical Rule**:
   - If $k \ge t$ and QBER $\approx 50\% \implies$ `FORGERY` or `IMPERSONATION`.
   - If $k \ge t$ and QBER $\in [t, 35\%] \implies$ `CHANNEL_MANIPULATION`.
   - If boundary-hugging event $\implies$ `STEALTH_THRESHOLD_EVENT`.
   - If evidence cannot uniquely distinguish $\implies$ `STATISTICAL ANOMALY — ATTACK TYPE NOT UNIQUELY IDENTIFIED`.
