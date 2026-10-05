"""
Quantum Core: Pauli and Clifford Gate Operations
Mathematical operations:
- I = [[1, 0], [0, 1]]
- X = [[0, 1], [1, 0]] (bit-flip)
- Y = [[0, -i], [i, 0]] (bit-and-phase flip)
- Z = [[1, 0], [0, -1]] (phase-flip)
- H = 1/sqrt(2) [[1, 1], [1, -1]]
"""

import math
from quantumshield.core.states import StateVector

SQRT2_INV = 1.0 / math.sqrt(2.0)

def apply_identity(psi: StateVector) -> StateVector:
    return StateVector(psi.a, psi.b)

def apply_pauli_x(psi: StateVector) -> StateVector:
    """X |psi> = X (a|0> + b|1>) = b|0> + a|1>"""
    return StateVector(psi.b, psi.a)

def apply_pauli_y(psi: StateVector) -> StateVector:
    """Y |psi> = Y (a|0> + b|1>) = -i b|0> + i a|1>"""
    return StateVector(complex(0, -1) * psi.b, complex(0, 1) * psi.a)

def apply_pauli_z(psi: StateVector) -> StateVector:
    """Z |psi> = Z (a|0> + b|1>) = a|0> - b|1>"""
    return StateVector(psi.a, -psi.b)

def apply_hadamard(psi: StateVector) -> StateVector:
    """H |psi> = (a+b)/sqrt(2) |0> + (a-b)/sqrt(2) |1>"""
    return StateVector((psi.a + psi.b) * SQRT2_INV, (psi.a - psi.b) * SQRT2_INV)

def apply_pauli_correction(psi: StateVector, m1: int, m2: int) -> StateVector:
    """
    Standard Bell teleportation Pauli correction on Bob's qubit:
    m1 m2 = 00 -> Identity
    m1 m2 = 01 -> Pauli X
    m1 m2 = 10 -> Pauli Z
    m1 m2 = 11 -> Pauli X Z (-i Y)
    """
    state = psi
    if m2 == 1:
        state = apply_pauli_x(state)
    if m1 == 1:
        state = apply_pauli_z(state)
    return state
