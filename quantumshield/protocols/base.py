"""
Protocol Engine: Abstract Protocol Interface
Decouples statistical detection and attacks from any specific QDS implementation.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple
from quantumshield.core.states import StateVector

class ProtocolInterface(ABC):
    @property
    @abstractmethod
    def protocol_name(self) -> str:
        pass

    @property
    @abstractmethod
    def protocol_version(self) -> str:
        pass

    @abstractmethod
    def generate_keys(self, n_qubits: int, seed: int) -> Dict[str, Any]:
        """Generates signer private key and verifier reference key states."""
        pass

    @abstractmethod
    def distribute_keys(self, key_data: Dict[str, Any], noise_model: Any,
                        seed: int) -> Dict[str, Any]:
        """Distributes quantum states to verifiers (e.g. via Bell teleportation + channel noise)."""
        pass

    @abstractmethod
    def sign(self, message: bytes, private_key: Dict[str, Any],
             verifier_id: str, seed: int) -> Dict[str, Any]:
        """Produces a QDS signature packet with nonce and timestamp."""
        pass

    @abstractmethod
    def verify(self, signature_packet: Dict[str, Any], verifier_key: Dict[str, Any],
               seed: int) -> Dict[str, Any]:
        """Verifies received signature packet using projective measurements."""
        pass

    @abstractmethod
    def serialize(self, packet: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    def deserialize(self, raw_str: str) -> Dict[str, Any]:
        pass
