# QUANTUM DIGITAL SIGNATURE (QDS-v1.0) PROTOCOL SPECIFICATION

## 1. Mathematical Primitives
### 1.1 Pauli Eigenstates
Single-qubit quantum states are prepared across three orthogonal bases:
- **Z-Basis**: $|0\rangle = \begin{pmatrix} 1 \\ 0 \end{pmatrix}, \quad |1\rangle = \begin{pmatrix} 0 \\ 1 \end{pmatrix}$
- **X-Basis**: $|+\rangle = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 \\ 1 \end{pmatrix}, \quad |-\rangle = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 \\ -1 \end{pmatrix}$
- **Y-Basis**: $|+i\rangle = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 \\ i \end{pmatrix}, \quad |-i\rangle = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 \\ -i \end{pmatrix}$

### 1.2 Entanglement Distribution via Teleportation
1. Alice and Bob share entangled Bell pairs:
   $$|\Phi^+\rangle_{23} = \frac{1}{\sqrt{2}} (|00\rangle + |11\rangle)_{23}$$
2. Alice performs a Bell-state measurement on her private state $|\psi\rangle_1$ and her half of the Bell pair (qubit 2).
3. The classical measurement outcome $(m_1, m_2) \in \{00, 01, 10, 11\}$ is communicated to Bob over a classical channel.
4. Bob applies Pauli correction:
   $$\hat{U}_{\text{corr}} = X^{m_2} Z^{m_1}$$
5. Under ideal conditions, Bob's qubit 3 reconstructs $|\psi\rangle$ with fidelity $\mathcal{F} = 1.0$.

---

## 2. Protocol Workflow
1. **Document Hashing**: Alice computes $h = \text{SHA-256}(M)$.
2. **Key Generation**: Alice generates private basis vector $b \in \{X, Y, Z\}^n$ and key bits $k \in \{0, 1\}^n$.
3. **Teleportation**: Alice teleports $|\psi_i\rangle = |b_i, k_i\rangle$ to Bob through the quantum channel.
4. **Channel Noise**: The channel applies configured noise (Depolarizing $\mathcal{E}$, Bit-flip, or Phase-flip).
5. **Signing**: Alice packages $(h, b, k, \text{nonce}, \text{timestamp}, \text{verifier\_id})$.
6. **Verification**: Bob measures his received qubits in declared bases $b_i$. If outcome bit $\neq k_i$, Bob increments mismatch count $mismatches$.
7. **Verdict**: Bob evaluates $k$ against the calibrated threshold $t$.
