"""
Quantum Core: Bell States and Entanglement Primitives
Mathematical representations:
|Phi+> = 1/sqrt(2) (|00> + |11>)
|Phi-> = 1/sqrt(2) (|00> - |11>)
|Psi+> = 1/sqrt(2) (|01> + |10>)
|Psi-> = 1/sqrt(2) (|01> - |10>)
"""

from typing import Tuple
import random

class BellPair:
    """Represents an entangled Bell pair shared between Alice and Bob."""
    __slots__ = ('name', 'state_label')

    def __init__(self, state_label: str = "Phi+"):
        if state_label not in ("Phi+", "Phi-", "Psi+", "Psi-"):
            raise ValueError(f"Invalid Bell state: {state_label}")
        self.state_label = state_label
        self.name = f"|{state_label}>"

    def __repr__(self) -> str:
        return f"BellPair({self.name})"

def sample_bell_measurement(rng: random.Random) -> Tuple[int, int]:
    """
    Simulates projective Bell measurement by Alice on state |psi> and her Bell-pair qubit.
    For maximally entangled |Phi+>, all 4 Bell projection outcomes (00, 01, 10, 11)
    occur with equal probability 0.25 under Born rule.
    Returns:
        (m1, m2) where:
        00 -> |Phi+>
        01 -> |Psi+>
        10 -> |Phi->
        11 -> |Psi->
    """
    outcome = rng.randint(0, 3)
    m1 = (outcome >> 1) & 1
    m2 = outcome & 1
    return m1, m2
