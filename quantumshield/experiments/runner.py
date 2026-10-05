"""
Experiment Engine: Experiment Runner
Coordinates the deterministic end-to-end evaluation flow:
USER INPUT -> MESSAGE/FILE -> SHA-256 -> QDS PROTOCOL -> KEY GENERATION
-> BELL-PAIR DISTRIBUTION -> QUANTUM TELEPORTATION -> NOISY CHANNEL
-> ATTACK SIMULATOR -> PAULI CORRECTION -> PROJECTIVE MEASUREMENT
-> QBER / MISMATCH -> STATISTICAL DETECTION -> REGISTRY CHECKS
-> DECISION ENGINE -> VERDICT -> THREAT CLASSIFICATION -> AUDIT RECORD
"""

from typing import Dict, Any, Optional
import time
import random
import uuid
from quantumshield.protocols.teleportation_qds import TeleportationQDSProtocol
from quantumshield.channel.noise import NoiseModel
from quantumshield.channel.calibration import calibrate_channel
from quantumshield.attacks.base import AttackEngine
from quantumshield.detection.decision import DecisionEngine, DetectionContext
from quantumshield.registry.registry_manager import RegistryManager
from quantumshield.audit.manifest import ExperimentManifest, canonical_json_hash
from quantumshield.audit.audit_chain import AuditChain

class ExperimentRunner:
    def __init__(self, registry_manager: Optional[RegistryManager] = None,
                 audit_chain: Optional[AuditChain] = None):
        self.registry_manager = registry_manager or RegistryManager()
        self.audit_chain = audit_chain or AuditChain()
        self.protocol = TeleportationQDSProtocol()

    def run_experiment(self, message: str, n_qubits: int = 1000,
                       noise_model_name: str = "depolarizing", noise_rate: float = 0.02,
                       attack_type: str = "none", attack_strength: float = 0.20,
                       alpha: float = 1e-4, beta: float = 1e-4,
                       verifier_id: str = "verifier_bob", seed: int = 1337,
                       experiment_id: Optional[str] = None,
                       replay_nonce: Optional[str] = None,
                       expired_timestamp: Optional[float] = None) -> Dict[str, Any]:
        """Runs a complete deterministic security evaluation experiment."""
        exp_id = experiment_id or f"exp_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
        rng = random.Random(seed)

        # 1. Message encoding and SHA-256
        msg_bytes = message.encode('utf-8')

        # 2. Key Generation
        key_data = self.protocol.generate_keys(n_qubits=n_qubits, seed=seed)

        # 3. Channel Noise Model & Honest Calibration
        noise = NoiseModel(model_type=noise_model_name, rate=noise_rate)
        # Calibrate p0
        calib = calibrate_channel(noise, n_trials=min(1000, n_qubits), seed=seed + 1)
        p0 = calib["p0_empirical"] if calib["p0_empirical"] > 0 else noise.theoretical_p0()
        p0 = max(0.0001, p0)

        # 4. Teleportation-based Distribution
        dist_res = self.protocol.distribute_keys(key_data, noise, seed=seed + 2)
        teleported_states = dist_res["teleported_states"]

        # 5. Attack Injection
        modified_states = list(teleported_states)
        nonce_override = replay_nonce
        timestamp_override = expired_timestamp
        effective_attack_strength = attack_strength

        if attack_type == "forgery":
            modified_states = AttackEngine.apply_forgery(
                teleported_states, key_data["bases"], rng=random.Random(seed + 3)
            )
        elif attack_type == "impersonation":
            modified_states = AttackEngine.apply_impersonation(
                teleported_states, rng=random.Random(seed + 3)
            )
        elif attack_type == "intercept_resend":
            modified_states = AttackEngine.apply_intercept_resend(
                teleported_states, attack_strength=attack_strength, rng=random.Random(seed + 3)
            )
        elif attack_type == "stealth":
            threshold_rate = (p0 + 0.05)
            modified_states, f_actual = AttackEngine.apply_stealth_attack(
                teleported_states, target_threshold_rate=threshold_rate,
                p0=p0, n_qubits=n_qubits, attacker_knowledge=0.90,
                rng=random.Random(seed + 3)
            )
            effective_attack_strength = f_actual
        elif attack_type == "replay":
            # Replay attack keeps states but attempts to reuse nonce or stale timestamp
            # If no override provided, generate a nonce that was already registered
            if not nonce_override:
                dummy_nonce = f"replayed_nonce_{seed}"
                # Pre-register nonce to simulate previous valid transmission
                self.registry_manager.nonce_registry.register(dummy_nonce, "prior_exp", verifier_id)
                nonce_override = dummy_nonce
        elif attack_type == "unauthorized_verification":
            verifier_id = "unauthorized_eve_node"

        # 6. Sign
        sig_packet = self.protocol.sign(
            message=msg_bytes,
            key_data=key_data,
            verifier_id=verifier_id,
            seed=seed + 4,
            custom_nonce=nonce_override,
            custom_timestamp=timestamp_override
        )

        # 7. Verify via Projective Measurements
        verify_res = self.protocol.verify(
            signature_packet=sig_packet,
            received_states=modified_states,
            seed=seed + 5
        )

        # 8. Classical Registry Checks
        reg_res = self.registry_manager.check_and_register(
            nonce=sig_packet["nonce"],
            timestamp=sig_packet["timestamp"],
            verifier_id=sig_packet["verifier_id"],
            experiment_id=exp_id,
            current_time=sig_packet["timestamp"]
        )

        # 9. Statistical Detection & Decision Engine
        det_context = DetectionContext(
            mismatches=verify_res["mismatches"],
            n_qubits=verify_res["n_verified"],
            p0=p0,
            alpha=alpha,
            beta=beta,
            registry_res=reg_res,
            mismatch_stream=verify_res["mismatch_stream"],
            attack_hint=attack_type,
            experiment_id=exp_id
        )
        decision = DecisionEngine.evaluate(det_context)

        # 10. Audit Chain Record Creation
        config_payload = {
            "experiment_id": exp_id,
            "message": message,
            "n_qubits": n_qubits,
            "noise_model": noise_model_name,
            "noise_rate": noise_rate,
            "attack_type": attack_type,
            "attack_strength": effective_attack_strength,
            "alpha": alpha,
            "beta": beta,
            "verifier_id": verifier_id,
            "seed": seed
        }
        res_payload = decision.to_dict()

        config_hash = canonical_json_hash(config_payload)
        res_hash = canonical_json_hash(res_payload)

        audit_record = self.audit_chain.append_record(
            experiment_id=exp_id,
            config_hash=config_hash,
            result_hash=res_hash,
            seed=seed
        )

        # 11. Manifest
        manifest = ExperimentManifest.create(
            experiment_id=exp_id,
            config=config_payload,
            results=res_payload,
            seed=seed
        )

        return {
            "experiment_id": exp_id,
            "manifest": manifest,
            "audit_record": audit_record.to_dict(),
            "config": config_payload,
            "results": res_payload,
            "signature_packet": sig_packet,
            "calibration": calib,
            "status": "SIMULATED"
        }
