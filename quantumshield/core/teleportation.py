"""
Quantum Core: Teleportation Simulation Engine
Reference model:
Input:
  - Source state |psi> (Pauli eigenstate or arbitrary qubit)
  - Shared Bell pair (|Phi+>)
  - Measurement randomness
Output:
  - Transmitted classical bits (m1, m2)
  - Post-teleportation state at receiver (before and after Pauli correction)
  - State fidelity <psi|rho_teleported|psi>
"""

from typing import Dict, Any
import random
from quantumshield.core.states import StateVector
from quantumshield.core.bell import sample_bell_measurement
from quantumshield.core.gates import apply_pauli_correction, apply_pauli_x, apply_pauli_z

class TeleportationResult:
    __slots__ = ('initial_state', 'm1', 'm2', 'raw_received_state', 'corrected_state', 'fidelity')

    def __init__(self, initial_state: StateVector, m1: int, m2: int,
                 raw_received_state: StateVector, corrected_state: StateVector, fidelity: float):
        self.initial_state = initial_state
        self.m1 = m1
        self.m2 = m2
        self.raw_received_state = raw_received_state
        self.corrected_state = corrected_state
        self.fidelity = fidelity

    def to_dict(self) -> Dict[str, Any]:
        return {
            "m1": self.m1,
            "m2": self.m2,
            "fidelity": self.fidelity,
            "initial_state": self.initial_state.to_dict(),
            "corrected_state": self.corrected_state.to_dict()
        }

def simulate_teleportation(psi: StateVector, rng: random.Random) -> TeleportationResult:
    """
    Executes standard quantum teleportation protocol:
    1. Alice performs Bell-state measurement on |psi> and half of |Phi+>
    2. Receives classical outcome bits (m1, m2)
    3. Bob's half collapses to Z^{m1} X^{m2} |psi>
    4. Bob receives classical bits (m1, m2) and applies correction X^{m2} Z^{m1}
    5. Bob reconstructs |psi> identically.
    """
    m1, m2 = sample_bell_measurement(rng)
    
    # State before Bob's correction
    raw_bob = psi
    if m2 == 1:
        raw_bob = apply_pauli_x(raw_bob)
    if m1 == 1:
        raw_bob = apply_pauli_z(raw_bob)

    # Bob's correction
    corrected = apply_pauli_correction(raw_bob, m1, m2)
    fidelity = psi.transition_probability(corrected)

    return TeleportationResult(
        initial_state=psi,
        m1=m1,
        m2=m2,
        raw_received_state=raw_bob,
        corrected_state=corrected,
        fidelity=fidelity
    )
