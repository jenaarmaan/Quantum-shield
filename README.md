# QuantumShield: Quantum Digital Signature Security Evaluation Platform

> **"QuantumShield measures how secure a defined quantum digital-signature protocol remains under defined attacks and channel noise."**

---

## Executive Summary
QuantumShield is a deterministic, explainable, and reproducible quantum security evaluation and red-team platform for quantum digital-signature (QDS) protocols. It allows researchers, security auditors, and quantum communication teams to model quantum state key distribution via Bell-pair teleportation, calibrate honest channel noise, inject controlled red-team attacks, and perform exact statistical detection using exact binomial hypothesis testing and Wald's Sequential Probability Ratio Test (SPRT).

---

## Core Capabilities
1. **Document Hashing**: Client-side, privacy-preserving SHA-256 computation.
2. **Pauli Eigenstate Keys**: 6-state conjugate Pauli alphabet $\{|0\rangle, |1\rangle, |+\rangle, |-\rangle, |+i\rangle, |-i\rangle\}$.
3. **Teleportation Simulation**: Bell-pair $|\Phi^+\rangle$ distribution, Bell measurement, and feedforward Pauli corrections.
4. **Channel Noise Models**: Depolarizing, bit-flip, and phase-flip noise with honest baseline calibration ($p_0$).
5. **Red-Team Threat Models**:
   - Blind Forgery
   - Signer Impersonation
   - Nonce Replay
   - Unauthorized Verifier
   - Intercept-Resend (tunable $f \in [0, 1]$)
   - Adaptive Stealth Attacker
6. **Statistical Detection**:
   - Exact Binomial Tail Probability $P(X \ge k \mid n, p_0)$ via Lentz's continued fraction incomplete beta
   - Critical Threshold $t$ via binary search
   - Standardized Z-Score
   - Wald's SPRT sequential detector with early stopping savings
7. **Classical Registries**: Nonce Registry (replay immunity), Timestamp Window Registry, and Verifier Access Control Registry.
8. **Deterministic Decision Engine**: Strict separation from AI/ML. Acceptance or rejection is 100% deterministic.
9. **Plain-Language Explanations**: Generated from structured detector facts.
10. **Interactive Visualizations**:
    - Security Boundary Map (Attack vs Noise parameter plane)
    - SPRT Log-Likelihood Ratio Trajectory
    - Binomial Mismatch Distribution with Shaded Tail Area
    - 3D/2D Bloch Sphere Pauli Eigenstate Inspector
11. **Cryptographic Audit Ledger**: Immutable SHA-256 hash-linked blocks with automated tamper detection.
12. **QDS-Bench**: 8 standardized scientific benchmark scenarios.
13. **Reports**: Instant export in JSON, CSV, formatted standalone HTML, and printable PDF formats.
14. **Cross-Language Validation**: Dual reference implementations in Python 3.10+ and TypeScript/WebAssembly sharing identical golden test vectors.

---

## Quick Start

### 1. Web Application (Vite + Express Full-Stack)
```bash
# Start full-stack server on port 3000
npm run dev

# Or build and launch production server
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Python Reference Engine & Tests
```bash
# Run comprehensive test suite
python3 quantumshield/tests/test_all.py

# Run QDS-Bench benchmark suite
python3 -c "from quantumshield.benchmark.qds_bench import QDSBenchRunner; print(QDSBenchRunner.run_all())"
```

---

## Directory Structure
```
quantumshield/             # Python 3.10+ Scientific Reference Engine
├── core/                  # States, gates, Bell pairs, teleportation, measurement
├── channel/               # Depolarizing, bit-flip, phase-flip noise & calibration
├── protocols/             # Teleportation QDS protocol engine
├── attacks/               # Forgery, impersonation, replay, intercept-resend, stealth
├── detection/             # Exact binomial test, Z-score, Wald SPRT, decision engine
├── registry/              # Nonce, timestamp, and verifier registries
├── experiments/           # Experiment runner, sweeps, Monte Carlo simulator
├── advisor/               # Parameter advisor & security boundary engine
├── audit/                 # Hash-linked audit ledger & reproduction manifests
├── benchmark/             # QDS-Bench 8-scenario suite
└── tests/                 # Unit, integration, property tests & golden test vectors

src/                       # TypeScript / WebAssembly / React Application
├── lib/                   # Exact mathematical parity with Python reference
│   ├── quantum/           # States, Bell pairs, teleportation
│   ├── channel/           # Noise channels & calibration
│   ├── protocol/          # SHA-256 & QDS protocol
│   ├── attacks/           # Attack injection models
│   ├── detection/         # Exact binomial math, SPRT, decision engine
│   ├── registry/          # Classical registries
│   ├── audit/             # Hash chain manager
│   ├── advisor/           # Parameter advisor & boundary engine
│   ├── benchmark/         # QDS-Bench runner
│   ├── reports/           # JSON, CSV, HTML export
│   └── pwa/               # PWA install & offline connectivity hook
├── components/            # UI components (Zero-pill, high-contrast, scientific)
│   ├── charts/            # BoundaryChart, SPRTChart, DistributionChart, BlochSphere
│   ├── views/             # SignatureLab, AttackLab, Detection, Benchmark, Audit, etc.
│   ├── TopNav.tsx         # 3-Zone Top Bar
│   └── TelemetryRibbon.tsx# Science telemetry ribbon
├── App.tsx                # Main application controller
└── main.tsx

server.ts                  # Express backend mounting REST API & Vite middleware
docs/                      # Comprehensive scientific documentation
```

---

## License
Apache-2.0
