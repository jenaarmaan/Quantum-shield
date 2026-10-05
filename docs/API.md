# QUANTUMSHIELD REST API SPECIFICATION (v1)

Base URL: `http://localhost:3000/api/v1`

## Endpoints

### 1. `POST /api/v1/hash`
Computes SHA-256 digest of document payload.
```json
// Request
{ "message": "Transaction payload" }

// Response
{
  "message": "Transaction payload",
  "sha256": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  "length_bytes": 19
}
```

### 2. `POST /api/v1/experiment/run`
Executes an end-to-end deterministic security evaluation trial.
```json
// Request
{
  "message": "Target document",
  "n_qubits": 1000,
  "noise_model": "depolarizing",
  "noise_rate": 0.02,
  "attack_type": "intercept_resend",
  "attack_strength": 0.20,
  "alpha": 0.0001,
  "beta": 0.0001,
  "seed": 1337
}

// Response
{
  "experiment_id": "exp_1775376000_a1b2",
  "results": {
    "verdict": "REJECT",
    "threat_type": "CHANNEL_MANIPULATION",
    "qber": 0.081,
    "mismatches": 81,
    "p0": 0.0133,
    "threshold": 38,
    "threshold_rate": 0.038,
    "p_value": 1.2e-9,
    "explanation": "Signature rejected because observed mismatch rate..."
  }
}
```

### 3. `GET /api/v1/experiment/:id`
Retrieves experiment record by unique identifier.

### 4. `POST /api/v1/experiment/:id/reproduce`
Re-runs experiment under identical configuration and seed, verifying bitwise hash identity.

### 5. `POST /api/v1/advisor`
Calculates recommended signature length $n$ and threshold $t$.

### 6. `GET /api/v1/security-boundary`
Returns discrete grid of operating points across noise and attack dimensions.

### 7. `POST /api/v1/audit/verify`
Validates full cryptographic integrity of the SHA-256 audit ledger.

### 8. `GET /api/v1/benchmarks` and `POST /api/v1/benchmarks/run`
Executes all 8 QDS-Bench benchmark scenarios.
