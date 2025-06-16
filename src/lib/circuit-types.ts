
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
  | "MEASURE" | "MEASURE_ALL" | "RESET"; // Measurement & Reset

export interface Gate {
  id: string;
  type: GateSymbol;
  qubits: number[];
  column: number;
  name?: string;
  // Parameters for gates like RX, U3, etc. will be handled in future enhancements
  // params?: { [key: string]: number };
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

// Information for displaying gates in the palette
export interface PaletteGateInfo {
  type: GateSymbol;
  displayName: string; // Text to display in palette, e.g., "RX(θ)"
  tooltip: string; // Tooltip for the palette item
  numQubits: 1 | 2 | 3 | 'all'; // Number of qubits the gate acts on, 'all' for Measure All
}

export interface GateCategory {
  name: string;
  gates: PaletteGateInfo[];
}

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
      { type: "RX", displayName: "RX(θ)", tooltip: "Rotation around X-axis by θ", numQubits: 1 },
      { type: "RY", displayName: "RY(θ)", tooltip: "Rotation around Y-axis by θ", numQubits: 1 },
      { type: "RZ", displayName: "RZ(θ)", tooltip: "Rotation around Z-axis by θ", numQubits: 1 },
    ],
  },
  {
    name: "Single Qubit: Phases",
    gates: [
      { type: "SDG", displayName: "S†", tooltip: "S-dagger Gate (conjugate transpose of S)", numQubits: 1 },
      { type: "TDG", displayName: "T†", tooltip: "T-dagger Gate (conjugate transpose of T)", numQubits: 1 },
      { type: "PHASE", displayName: "P(λ)", tooltip: "Phase Gate (adds phase e^(iλ))", numQubits: 1 },
    ],
  },
  {
    name: "Single Qubit: Universal",
    gates: [
      { type: "U1", displayName: "U1(λ)", tooltip: "U1 Gate (Phase(λ))", numQubits: 1 },
      { type: "U2", displayName: "U2(φ,λ)", tooltip: "U2 Gate", numQubits: 1 },
      { type: "U3", displayName: "U3(θ,φ,λ)", tooltip: "U3 Gate (general single-qubit rotation)", numQubits: 1 },
    ],
  },
  {
    name: "Two Qubit Gates",
    gates: [
      { type: "CNOT", displayName: "CNOT", tooltip: "Controlled-NOT (CX) Gate", numQubits: 2 },
      { type: "CY", displayName: "CY", tooltip: "Controlled-Y Gate", numQubits: 2 },
      { type: "CZ", displayName: "CZ", tooltip: "Controlled-Z Gate", numQubits: 2 },
      { type: "SWAP", displayName: "SWAP", tooltip: "SWAP Gate (exchanges two qubits)", numQubits: 2 },
      { type: "ISWAP", displayName: "iSWAP", tooltip: "iSWAP Gate", numQubits: 2 },
      { type: "CPHASE", displayName: "CP(θ)", tooltip: "Controlled Phase Gate by θ", numQubits: 2 },
      { type: "CRX", displayName: "CRX(θ)", tooltip: "Controlled RX Gate by θ", numQubits: 2 },
      { type: "CRY", displayName: "CRY(θ)", tooltip: "Controlled RY Gate by θ", numQubits: 2 },
      { type: "CRZ", displayName: "CRZ(θ)", tooltip: "Controlled RZ Gate by θ", numQubits: 2 },
    ],
  },
  {
    name: "Three Qubit Gates",
    gates: [
      { type: "TOFFOLI", displayName: "Toffoli", tooltip: "Toffoli Gate (CCX, doubly controlled-NOT)", numQubits: 3 },
      { type: "FREDKIN", displayName: "Fredkin", tooltip: "Fredkin Gate (CSWAP, controlled SWAP)", numQubits: 3 },
      { type: "CCZ", displayName: "CCZ", tooltip: "Controlled-Controlled-Z Gate", numQubits: 3 },
    ],
  },
  {
    name: "Measurement & Reset",
    gates: [
      { type: "MEASURE", displayName: "Measure", tooltip: "Measure single qubit to classical bit", numQubits: 1 },
      { type: "MEASURE_ALL", displayName: "Measure All", tooltip: "Measure all qubits", numQubits: 'all' },
      { type: "RESET", displayName: "Reset", tooltip: "Reset qubit to |0⟩ state", numQubits: 1 },
    ],
  },
];

// Available gates for AI suggestions and other places that need a flat list of symbols
export const AVAILABLE_GATES: GateSymbol[] = GATE_CATEGORIES.flatMap(category => category.gates.map(gate => gate.type));
