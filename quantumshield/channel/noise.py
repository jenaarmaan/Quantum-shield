"""
Channel Engine: Quantum Noise Models
Simulates open quantum system noise channels acting on transmitting qubits:
1. Depolarizing Channel:
   E(rho) = (1 - eps) rho + (eps/3) [X rho X + Y rho Y + Z rho Z]
2. Bit-Flip Channel:
   E(rho) = (1 - eps) rho + eps X rho X
3. Phase-Flip Channel:
   E(rho) = (1 - eps) rho + eps Z rho Z
"""

from typing import Optional
import random
from quantumshield.core.states import StateVector
from quantumshield.core.gates import apply_pauli_x, apply_pauli_y, apply_pauli_z

class NoiseModel:
    """Configurable noise model for quantum channel."""
    def __init__(self, model_type: str = "depolarizing", rate: float = 0.02):
        if model_type not in ("depolarizing", "bit_flip", "phase_flip", "none"):
            raise ValueError(f"Unsupported noise model: {model_type}")
        if not (0.0 <= rate <= 1.0):
            raise ValueError(f"Noise rate must be in [0, 1], got {rate}")
        self.model_type = model_type
        self.rate = float(rate)

    def apply(self, psi: StateVector, rng: random.Random) -> StateVector:
        if self.model_type == "none" or self.rate <= 0.0:
            return psi

        roll = rng.random()
        if self.model_type == "depolarizing":
            if roll < self.rate:
                # Equally distribute between X, Y, Z
                sub_roll = rng.random()
                if sub_roll < 1.0 / 3.0:
                    return apply_pauli_x(psi)
                elif sub_roll < 2.0 / 3.0:
                    return apply_pauli_y(psi)
                else:
                    return apply_pauli_z(psi)
            return psi

        elif self.model_type == "bit_flip":
            if roll < self.rate:
                return apply_pauli_x(psi)
            return psi

        elif self.model_type == "phase_flip":
            if roll < self.rate:
                return apply_pauli_z(psi)
            return psi

        return psi

    def theoretical_p0(self) -> float:
        """
        Theoretical expected mismatch probability under symmetric Pauli eigenstate bases
        (averaging uniformly over X, Y, Z eigenstates):
        - Depolarizing: p0 = 2/3 * eps
        - Bit-flip: p0 = 2/3 * eps
        - Phase-flip: p0 = 2/3 * eps
        """
        if self.model_type == "none" or self.rate <= 0.0:
            return 0.0
        return (2.0 / 3.0) * self.rate
