# QDS-BENCH BENCHMARK SUITE

## Overview
QDS-Bench is a standardized research evaluation framework for measuring quantum digital signature protocol stability and adversary resistance.

## Standard Scenarios
- **QDS-BENCH-01: Honest Channel Stability**: Confirms honest transmission remains below threshold.
- **QDS-BENCH-02: Blind Forgery Resistance**: Evaluates rejection when adversary signs without private keys.
- **QDS-BENCH-03: Signer Impersonation Detection**: Verifies defense against entity impersonation.
- **QDS-BENCH-04: Nonce-Replay Registry Enforcement**: Confirms identical packet resubmissions are rejected.
- **QDS-BENCH-05: Unauthorized Verifier Access Control**: Tests exclusion of unregistered nodes.
- **QDS-BENCH-06: Intercept-Resend Sensitivity (f = 0.20)**: Measures sensitivity to 20% quantum eavesdropping.
- **QDS-BENCH-07: Adaptive Stealth Attacker Boundary Test**: Evaluates red-team adversarial boundary evasion.
- **QDS-BENCH-08: Sequential Detection (SPRT) Sample Efficiency**: Quantifies sample reduction under Wald SPRT.

## Execution
```bash
# Python Reference Suite
python3 -c "from quantumshield.benchmark.qds_bench import QDSBenchRunner; print(QDSBenchRunner.run_all())"

# REST API
curl -X POST http://localhost:3000/api/v1/benchmarks/run
```
