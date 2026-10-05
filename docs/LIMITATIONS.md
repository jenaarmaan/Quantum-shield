# QUANTUMSHIELD SCIENTIFIC HONESTY & LIMITATIONS

## 1. Simulated vs Hardware Execution
QuantumShield performs high-precision mathematical simulation of pure state vectors, Bell-pair teleportation, stochastic Pauli noise channels, and projective measurements. It does NOT claim to run physical quantum hardware inside the browser or mobile device.

## 2. Distinction of Result Statuses
Every output in QuantumShield is explicitly tagged with one of the following statuses:
- **`THEORETICAL`**: Calculated from closed-form analytic asymptotic equations (e.g. Beasley-Springer-Moro normal quantiles in the Parameter Advisor).
- **`SIMULATED`**: Computed via deterministic state vector and pseudo-random sampling.
- **`EMPIRICALLY_VALIDATED`**: Measured across multi-trial Monte Carlo evaluation suites.
- **`QISKIT_VALIDATED`**: Cross-checked against Qiskit statevector / Aer simulators.
- **`HARDWARE_VALIDATED`**: Reserved exclusively for physical quantum processing unit (QPU) testbeds.

## 3. Threat Boundary Realities
- **No Unconditional Real-World Immunity**: Security proofs assume authenticated classical channels and bounded side-channel leaks.
- **Detector Side-Channels**: Physical optical detectors in real-world quantum testbeds are subject to detector-blinding and efficiency mismatch attacks; in QuantumShield, ideal projective measurements with configurable stochastic noise are modeled.
