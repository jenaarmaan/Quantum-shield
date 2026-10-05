"""
Quantum Core: Projective Quantum Measurement
Supports projective measurements onto Pauli bases:
- Z basis: {|0>, |1>}
- X basis: {|+>, |->}
- Y basis: {|+i>, |-i>}
Using Born's rule: P(outcome = m) = |<Bm | psi>|^2
"""

from typing import Tuple, Dict, Any
import random
from quantumshield.core.states import StateVector, get_pauli_state

def measure_state(psi: StateVector, basis: str, rng: random.Random) -> Tuple[int, float]:
    """
    Performs projective measurement of single-qubit state |psi> in basis ('X', 'Y', 'Z').
    Returns:
        (measured_bit, prob_0)
        measured_bit: 0 or 1
        prob_0: probability of obtaining outcome 0 under Born's rule
    """
    basis_up = basis.upper()
    state_0 = get_pauli_state(basis_up, 0)
    p0 = psi.transition_probability(state_0)
    # Numerical clamp
    p0 = max(0.0, min(1.0, p0))
    
    roll = rng.random()
    measured_bit = 0 if roll < p0 else 1
    return measured_bit, p0
