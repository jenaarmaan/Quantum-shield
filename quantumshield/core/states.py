"""
Quantum Core: Quantum State Representation and Pauli Eigenstates
Documented mathematical model:
- Computational basis: |0> = [1, 0]^T, |1> = [0, 1]^T
- X basis eigenstates: |+> = 1/sqrt(2)[1, 1]^T, |-> = 1/sqrt(2)[1, -1]^T
- Y basis eigenstates: |+i> = 1/sqrt(2)[1, i]^T, |-i> = 1/sqrt(2)[1, -i]^T
- Bloch sphere mapping: r = (x, y, z) = (Tr(rho X), Tr(rho Y), Tr(rho Z))
"""

from __future__ import annotations
import math
import cmath
from typing import Tuple, List, Dict, Any

SQRT2_INV = 1.0 / math.sqrt(2.0)

class StateVector:
    """Represents a normalized 1-qubit pure state vector |psi> = a|0> + b|1>"""
    __slots__ = ('a', 'b')

    def __init__(self, a: complex, b: complex):
        norm = math.sqrt(abs(a)**2 + abs(b)**2)
        if norm < 1e-12:
            raise ValueError("Zero-norm quantum state is unphysical.")
        self.a = complex(a / norm)
        self.b = complex(b / norm)

    def inner_product(self, other: StateVector) -> complex:
        """<self | other> = a1* a2 + b1* b2"""
        return self.a.conjugate() * other.a + self.b.conjugate() * other.b

    def transition_probability(self, other: StateVector) -> float:
        """Born rule: |<self | other>|^2"""
        ip = self.inner_product(other)
        return float(abs(ip)**2)

    def bloch_coordinates(self) -> Tuple[float, float, float]:
        """Calculates (x, y, z) Bloch coordinates:
        x = 2 Re(a* b)
        y = 2 Im(a* b)
        z = |a|^2 - |b|^2
        """
        ab_star = self.a.conjugate() * self.b
        x = 2.0 * ab_star.real
        y = 2.0 * ab_star.imag
        z = (abs(self.a)**2) - (abs(self.b)**2)
        return (x, y, z)

    def to_dict(self) -> Dict[str, Any]:
        x, y, z = self.bloch_coordinates()
        return {
            "a": {"real": self.a.real, "imag": self.a.imag},
            "b": {"real": self.b.real, "imag": self.b.imag},
            "bloch": {"x": x, "y": y, "z": z}
        }

    def __repr__(self) -> str:
        return f"StateVector(a={self.a:.4f}, b={self.b:.4f})"


# Canonical Pauli Eigenstates
PAULI_EIGENSTATES = {
    # Z basis: eigenvalues +1, -1
    "Z0": StateVector(1.0 + 0.0j, 0.0 + 0.0j),      # |0>
    "Z1": StateVector(0.0 + 0.0j, 1.0 + 0.0j),      # |1>
    # X basis: eigenvalues +1, -1
    "X0": StateVector(SQRT2_INV, SQRT2_INV),        # |+>
    "X1": StateVector(SQRT2_INV, -SQRT2_INV),       # |->
    # Y basis: eigenvalues +1, -1
    "Y0": StateVector(SQRT2_INV, complex(0, SQRT2_INV)),  # |+i>
    "Y1": StateVector(SQRT2_INV, complex(0, -SQRT2_INV)) # |-i>
}

def get_pauli_state(basis: str, bit: int) -> StateVector:
    """Returns Pauli eigenstate for basis ('X','Y','Z') and bit value (0, 1)."""
    key = f"{basis.upper()}{int(bit)}"
    if key not in PAULI_EIGENSTATES:
        raise ValueError(f"Unknown Pauli eigenstate key: {key}")
    return PAULI_EIGENSTATES[key]
