

export type GateSymbol =
  | "H" | "X" | "Y" | "Z" | "S" | "T" | "I" // Basic Single Qubit
  | "RX" | "RY" | "RZ" // Rotations
  | "SDG" | "TDG" | "PHASE" // Phases (Sdg for S†, Tdg for T†, P for Phase(λ))
  | "U1" | "U2" | "U3" // Universal Single Qubit
  | "CNOT" | "CY" | "CZ" // Basic Two Qubit
  | "SWAP" | "ISWAP" // Other Two Qubit
  | "CPHASE" // Controlled Phase Two Qubit (CP for CPhase(θ))
  | "CRX" | "CRY" | "CRZ" // Controlled Rotations Two Qubit
  | "TOFFOLI" | "FREDKIN" | "CCZ" // Three Qubit (TOFFOLI for CCX, FREDKIN for CSWAP)
  | "MEASURE" | "MEASURE_ALL" | "RESET" // Measurement & Reset
  | "BARRIER"; // Barrier

export interface GateParamDetail {
  name: string; // e.g. 'θ', 'λ', 'φ'
  type: 'angle' | 'string' | 'number';
  defaultValue: number | string;
  displayName?: string; // Optional, for UI, e.g. "Theta (θ)"
}

export interface Gate {
  id: string;
  type: GateSymbol;
  qubits: number[];
  column: number;
  name?: string;
  params?: { [key: string]: number | string };
}

export interface VisualCircuit {
  numQubits: number;
  gates: Gate[];
  shots?: number;
  name?: string;
}

export interface SimulationResult {
  counts: { [key: string]: number };
}

export interface PaletteGateInfo {
  type: GateSymbol;
  displayName: string;
  tooltip: string;
  numQubits: 1 | 2 | 3 | 'all';
  paramDetails?: GateParamDetail[];
}

export interface GateCategory {
  name: string;
  gates: PaletteGateInfo[];
}

const DEFAULT_ANGLE = Math.PI / 2;

export const GATE_CATEGORIES: GateCategory[] = [
  {
    name: "Single Qubit: Basic",
    gates: [
      { type: "H", displayName: "H", tooltip: "Hadamard Gate", numQubits: 1 },
      { type: "X", displayName: "X", tooltip: "Pauli-X Gate (NOT Gate)", numQubits: 1 },
      { type: "Y", displayName: "Y", tooltip: "Pauli-Y Gate", numQubits: 1 },
      { type: "Z", displayName: "Z", tooltip: "Pauli-Z Gate", numQubits: 1 },
      { type: "S", displayName: "S", tooltip: "S Gate (Phase √Z)", numQubits: 1 },
      { type: "T", displayName: "T", tooltip: "T Gate (Phase ⁴√Z)", numQubits: 1 },
      { type: "I", displayName: "I", tooltip: "Identity Gate", numQubits: 1 },
    ],
  },
  {
    name: "Single Qubit: Rotations",
    gates: [
      { type: "RX", displayName: "RX(θ)", tooltip: "Rotation around X-axis by θ", numQubits: 1, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
      { type: "RY", displayName: "RY(θ)", tooltip: "Rotation around Y-axis by θ", numQubits: 1, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
      { type: "RZ", displayName: "RZ(θ)", tooltip: "Rotation around Z-axis by θ", numQubits: 1, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
    ],
  },
  {
    name: "Single Qubit: Phases",
    gates: [
      { type: "SDG", displayName: "S†", tooltip: "S-dagger Gate", numQubits: 1 },
      { type: "TDG", displayName: "T†", tooltip: "T-dagger Gate", numQubits: 1 },
      { type: "PHASE", displayName: "P(λ)", tooltip: "Phase Gate (adds phase e^(iλ))", numQubits: 1, paramDetails: [{ name: "lambda", displayName: "λ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
    ],
  },
  {
    name: "Single Qubit: Universal",
    gates: [
      { type: "U1", displayName: "U1(λ)", tooltip: "U1 Gate (Phase(λ))", numQubits: 1, paramDetails: [{ name: "lambda", displayName: "λ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
      { type: "U2", displayName: "U2(φ,λ)", tooltip: "U2 Gate", numQubits: 1, paramDetails: [{ name: "phi", displayName: "φ", type: "angle", defaultValue: DEFAULT_ANGLE }, { name: "lambda", displayName: "λ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
      { type: "U3", displayName: "U3(θ,φ,λ)", tooltip: "U3 Gate", numQubits: 1, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }, { name: "phi", displayName: "φ", type: "angle", defaultValue: DEFAULT_ANGLE }, { name: "lambda", displayName: "λ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
    ],
  },
  {
    name: "Two Qubit Gates",
    gates: [
      { type: "CNOT", displayName: "CNOT", tooltip: "Controlled-NOT (CX) Gate", numQubits: 2 },
      { type: "CY", displayName: "CY", tooltip: "Controlled-Y Gate", numQubits: 2 },
      { type: "CZ", displayName: "CZ", tooltip: "Controlled-Z Gate", numQubits: 2 },
      { type: "SWAP", displayName: "SWAP", tooltip: "SWAP Gate", numQubits: 2 },
      { type: "ISWAP", displayName: "iSWAP", tooltip: "iSWAP Gate", numQubits: 2 },
      { type: "CPHASE", displayName: "CP(θ)", tooltip: "Controlled Phase Gate by θ", numQubits: 2, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
      { type: "CRX", displayName: "CRX(θ)", tooltip: "Controlled RX Gate by θ", numQubits: 2, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
      { type: "CRY", displayName: "CRY(θ)", tooltip: "Controlled RY Gate by θ", numQubits: 2, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
      { type: "CRZ", displayName: "CRZ(θ)", tooltip: "Controlled RZ Gate by θ", numQubits: 2, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
    ],
  },
  {
    name: "Three Qubit Gates",
    gates: [
      { type: "TOFFOLI", displayName: "Toffoli", tooltip: "Toffoli Gate (CCX)", numQubits: 3 },
      { type: "FREDKIN", displayName: "Fredkin", tooltip: "Fredkin Gate (CSWAP)", numQubits: 3 },
      { type: "CCZ", displayName: "CCZ", tooltip: "Controlled-Controlled-Z Gate", numQubits: 3 },
    ],
  },
  {
    name: "Measurement & Utility",
    gates: [
      { type: "MEASURE", displayName: "Measure", tooltip: "Measure single qubit", numQubits: 1 },
      { type: "MEASURE_ALL", displayName: "Measure All", tooltip: "Measure all qubits", numQubits: 'all' },
      { type: "RESET", displayName: "Reset", tooltip: "Reset qubit to |0⟩ state", numQubits: 1 },
      { type: "BARRIER", displayName: "Barrier", tooltip: "Visual circuit barrier", numQubits: 'all' },
    ],
  },
];

export const AVAILABLE_GATES: GateSymbol[] = GATE_CATEGORIES.flatMap(category => category.gates.map(gate => gate.type));

export const GATE_INFO_MAP = new Map<GateSymbol, PaletteGateInfo>(
  GATE_CATEGORIES.flatMap(cat => cat.gates).map(g => [g.type, g])
);
