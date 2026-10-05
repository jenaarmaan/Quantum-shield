# REPRODUCIBILITY CONTRACT

Every experiment in QuantumShield is canonically identified by:
1. `experiment_id`
2. `seed` (32-bit unsigned integer)
3. `software_version` (1.0.0)
4. `protocol_version` (QDS-v1.0)
5. `detector_version` (2.1.0)
6. `config_hash` (SHA-256 of canonical JSON)
7. `result_hash` (SHA-256 of canonical measurement metrics)

### Reproduction Guarantee
Given identical inputs `(config, seed)`, QuantumShield guarantees bit-for-bit identical outputs:
- Identical Pauli eigenstate basis choices
- Identical Bell measurement outcomes
- Identical channel error events
- Identical mismatch count $k$
- Identical QBER $\frac{k}{n}$
- Identical exact binomial threshold $t$ and tail probability $p$
- Identical SPRT LLR trajectory and stopping step
- Identical verdict (`ACCEPT` / `REJECT`)
- Identical threat classification

If a reproduced result does not match, QuantumShield outputs a diff identifying the source of divergence (software version delta, seed mismatch, or config parameter variance).
