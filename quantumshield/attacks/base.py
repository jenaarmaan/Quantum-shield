"""
Attack Engine: Base Attack Abstraction and Attack Models
Isolates attack logic from detection and protocol engines.
"""

from typing import List, Dict, Any, Tuple
import random
import time
from quantumshield.core.states import StateVector, get_pauli_state
from quantumshield.core.measurement import measure_state

class AttackResult:
    __slots__ = ('attack_name', 'attack_strength', 'attack_params',
                 'modified_states', 'modified_nonce', 'modified_timestamp',
                 'modified_verifier_id', 'description')

    def __init__(self, attack_name: str, attack_strength: float, attack_params: Dict[str, Any],
                 modified_states: List[StateVector], modified_nonce: str,
                 modified_timestamp: float, modified_verifier_id: str, description: str):
        self.attack_name = attack_name
        self.attack_strength = attack_strength
        self.attack_params = attack_params
        self.modified_states = modified_states
        self.modified_nonce = modified_nonce
        self.modified_timestamp = modified_timestamp
        self.modified_verifier_id = modified_verifier_id
        self.description = description

    def to_dict(self) -> Dict[str, Any]:
        return {
            "attack_name": self.attack_name,
            "attack_strength": self.attack_strength,
            "attack_params": self.attack_params,
            "modified_nonce": self.modified_nonce,
            "modified_timestamp": self.modified_timestamp,
            "modified_verifier_id": self.modified_verifier_id,
            "description": self.description
        }

class AttackEngine:
    @staticmethod
    def apply_forgery(states: List[StateVector], bases: List[str],
                      rng: random.Random, strategy: str = "random_pauli") -> List[StateVector]:
        """
        Forgery Attack:
        Attacker has no private key states for message M'. Attacker prepares guessed states.
        In random_pauli strategy: picks random basis in {X, Y, Z} and random bit {0, 1}.
        Expected mismatch with legitimate verifier state: ~50% (or 2/3 when basis mismatched).
        """
        forged_states: List[StateVector] = []
        bases_pool = ["X", "Y", "Z"]
        for _ in states:
            guessed_basis = rng.choice(bases_pool)
            guessed_bit = rng.randint(0, 1)
            forged_states.append(get_pauli_state(guessed_basis, guessed_bit))
        return forged_states

    @staticmethod
    def apply_impersonation(states: List[StateVector], rng: random.Random) -> List[StateVector]:
        """
        Impersonation Attack:
        Adversary substitutes legitimate signer's qubits with self-generated coherent states or biased states.
        """
        substituted_states: List[StateVector] = []
        for _ in states:
            # Attacker generates arbitrary superposition or fixed basis
            b = rng.choice(["X", "Z"])
            bit = rng.randint(0, 1)
            substituted_states.append(get_pauli_state(b, bit))
        return substituted_states

    @staticmethod
    def apply_intercept_resend(states: List[StateVector], attack_strength: float,
                               rng: random.Random) -> List[StateVector]:
        """
        Intercept-Resend Attack:
        Attacker intercepts a fraction f in [0, 1] of the transmitting qubits.
        Measures each intercepted qubit in a randomly chosen basis {X, Y, Z} and re-prepares it.
        """
        f = max(0.0, min(1.0, float(attack_strength)))
        bases_pool = ["X", "Y", "Z"]
        output_states: List[StateVector] = []

        for psi in states:
            if rng.random() < f:
                # Intercepted!
                meas_basis = rng.choice(bases_pool)
                meas_bit, _ = measure_state(psi, meas_basis, rng)
                # Resend the collapsed/re-prepared eigenstate
                output_states.append(get_pauli_state(meas_basis, meas_bit))
            else:
                # Passed through unintercepted
                output_states.append(psi)

        return output_states

    @staticmethod
    def apply_stealth_attack(states: List[StateVector], target_threshold_rate: float,
                             p0: float, n_qubits: int, attacker_knowledge: float,
                             rng: random.Random) -> Tuple[List[StateVector], float]:
        """
        Adaptive Stealth Attacker:
        Attacker observes or estimates the threshold boundary and tunes attack strength f
        to keep expected QBER E[p] <= target_threshold_rate - safety_margin.
        Under intercept-resend, excess QBER is Delta = (1/3) * f (for 3-basis Pauli alphabet).
        E[p] = p0 + (1/3)*f <= threshold_rate
        f_max = 3 * max(0, threshold_rate - p0)
        """
        margin = (1.0 - attacker_knowledge) * 0.05
        f_safe = 3.0 * max(0.0, (target_threshold_rate - p0 - margin))
        # Add slight statistical fuzz
        f_actual = max(0.0, min(0.95, f_safe * (0.85 + 0.25 * rng.random())))
        
        modified = AttackEngine.apply_intercept_resend(states, f_actual, rng)
        return modified, f_actual
