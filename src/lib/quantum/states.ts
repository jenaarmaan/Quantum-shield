/**
 * Quantum Core: Quantum State Representation and Pauli Eigenstates
 */

export interface Complex {
  real: number;
  imag: number;
}

export const SQRT2_INV = 1.0 / Math.sqrt(2.0);

export class StateVector {
  readonly a: Complex;
  readonly b: Complex;

  constructor(a: Complex, b: Complex) {
    const norm = Math.sqrt(a.real * a.real + a.imag * a.imag + b.real * b.real + b.imag * b.imag);
    if (norm < 1e-12) {
      throw new Error("Zero-norm quantum state is unphysical.");
    }
    this.a = { real: a.real / norm, imag: a.imag / norm };
    this.b = { real: b.real / norm, imag: b.imag / norm };
  }

  innerProduct(other: StateVector): Complex {
    // a1* a2 + b1* b2
    const real = (this.a.real * other.a.real + this.a.imag * other.a.imag) +
                 (this.b.real * other.b.real + this.b.imag * other.b.imag);
    const imag = (this.a.real * other.a.imag - this.a.imag * other.a.real) +
                 (this.b.real * other.b.imag - this.b.imag * other.b.real);
    return { real, imag };
  }

  transitionProbability(other: StateVector): number {
    const ip = this.innerProduct(other);
    return ip.real * ip.real + ip.imag * ip.imag;
  }

  blochCoordinates(): { x: number; y: number; z: number } {
    // a* b = (a_r - i a_i)(b_r + i b_i) = (a_r b_r + a_i b_i) + i (a_r b_i - a_i b_r)
    const abReal = this.a.real * this.b.real + this.a.imag * this.b.imag;
    const abImag = this.a.real * this.b.imag - this.a.imag * this.b.real;
    const x = 2.0 * abReal;
    const y = 2.0 * abImag;
    const z = (this.a.real * this.a.real + this.a.imag * this.a.imag) -
              (this.b.real * this.b.real + this.b.imag * this.b.imag);
    return { x, y, z };
  }
}

export const PAULI_EIGENSTATES: Record<string, StateVector> = {
  Z0: new StateVector({ real: 1.0, imag: 0.0 }, { real: 0.0, imag: 0.0 }), // |0>
  Z1: new StateVector({ real: 0.0, imag: 0.0 }, { real: 1.0, imag: 0.0 }), // |1>
  X0: new StateVector({ real: SQRT2_INV, imag: 0.0 }, { real: SQRT2_INV, imag: 0.0 }), // |+>
  X1: new StateVector({ real: SQRT2_INV, imag: 0.0 }, { real: -SQRT2_INV, imag: 0.0 }), // |->
  Y0: new StateVector({ real: SQRT2_INV, imag: 0.0 }, { real: 0.0, imag: SQRT2_INV }), // |+i>
  Y1: new StateVector({ real: SQRT2_INV, imag: 0.0 }, { real: 0.0, imag: -SQRT2_INV }) // |-i>
};

export function getPauliState(basis: string, bit: number): StateVector {
  const key = `${basis.toUpperCase()}${bit}`;
  const st = PAULI_EIGENSTATES[key];
  if (!st) {
    throw new Error(`Unknown Pauli eigenstate: ${key}`);
  }
  return st;
}
