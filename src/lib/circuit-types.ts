
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
  name: string; 
  type: 'angle' | 'string' | 'number';
  defaultValue: number | string;
  displayName?: string; 
}

export interface Gate {
  id: string;
  type: GateSymbol;
  qubits: number[];
  column: number;
  params?: { [key: string]: number | string }; // Ensure params is always defined for gates that might have them
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
  numQubits: 1 | 2 | 3 | 'all'; // 'all' for gates like Barrier or MeasureAll
  paramDetails?: GateParamDetail[];
}

// Moved from circuit-library.ts to avoid circular dependencies if library uses VisualCircuit
export interface LibraryCircuitInfo {
  id: string;
  name: string;
  description: string;
  // visualCircuit: VisualCircuit; // Actual circuit data will be added later
}

export interface LibraryCategory {
  id: string;
  name: string;
  circuits: LibraryCircuitInfo[];
}


const DEFAULT_ANGLE = Math.PI / 2;

export const GATE_CATEGORIES: PaletteGateInfo[][] = [ // Changed to array of arrays for direct use
  // Single Qubit: Basic
  [
    { type: "H", displayName: "H", tooltip: "Hadamard Gate", numQubits: 1 },
    { type: "X", displayName: "X", tooltip: "Pauli-X Gate (NOT Gate)", numQubits: 1 },
    { type: "Y", displayName: "Y", tooltip: "Pauli-Y Gate", numQubits: 1 },
    { type: "Z", displayName: "Z", tooltip: "Pauli-Z Gate", numQubits: 1 },
    { type: "S", displayName: "S", tooltip: "S Gate (Phase √Z)", numQubits: 1 },
    { type: "T", displayName: "T", tooltip: "T Gate (Phase ⁴√Z)", numQubits: 1 },
    { type: "I", displayName: "I", tooltip: "Identity Gate", numQubits: 1 },
  ],
  // Single Qubit: Rotations
  [
    { type: "RX", displayName: "RX(θ)", tooltip: "Rotation around X-axis by θ", numQubits: 1, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
    { type: "RY", displayName: "RY(θ)", tooltip: "Rotation around Y-axis by θ", numQubits: 1, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
    { type: "RZ", displayName: "RZ(θ)", tooltip: "Rotation around Z-axis by θ", numQubits: 1, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
  ],
  // Single Qubit: Phases
  [
    { type: "SDG", displayName: "S†", tooltip: "S-dagger Gate", numQubits: 1 },
    { type: "TDG", displayName: "T†", tooltip: "T-dagger Gate", numQubits: 1 },
    { type: "PHASE", displayName: "P(λ)", tooltip: "Phase Gate (adds phase e^(iλ))", numQubits: 1, paramDetails: [{ name: "lambda", displayName: "λ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
  ],
  // Single Qubit: Universal
  [
    { type: "U1", displayName: "U1(λ)", tooltip: "U1 Gate (Phase(λ))", numQubits: 1, paramDetails: [{ name: "lambda", displayName: "λ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
    { type: "U2", displayName: "U2(φ,λ)", tooltip: "U2 Gate", numQubits: 1, paramDetails: [{ name: "phi", displayName: "φ", type: "angle", defaultValue: DEFAULT_ANGLE }, { name: "lambda", displayName: "λ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
    { type: "U3", displayName: "U3(θ,φ,λ)", tooltip: "U3 Gate", numQubits: 1, paramDetails: [{ name: "theta", displayName: "θ", type: "angle", defaultValue: DEFAULT_ANGLE }, { name: "phi", displayName: "φ", type: "angle", defaultValue: DEFAULT_ANGLE }, { name: "lambda", displayName: "λ", type: "angle", defaultValue: DEFAULT_ANGLE }] },
  ],
  // Two Qubit Gates
  [
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
  // Three Qubit Gates
  [
    { type: "TOFFOLI", displayName: "Toffoli", tooltip: "Toffoli Gate (CCX)", numQubits: 3 },
    { type: "FREDKIN", displayName: "Fredkin", tooltip: "Fredkin Gate (CSWAP)", numQubits: 3 },
    { type: "CCZ", displayName: "CCZ", tooltip: "Controlled-Controlled-Z Gate", numQubits: 3 },
  ],
  // Measurement & Utility
  [
    { type: "MEASURE", displayName: "Measure", tooltip: "Measure single qubit", numQubits: 1 },
    { type: "MEASURE_ALL", displayName: "Measure All", tooltip: "Measure all qubits", numQubits: 'all' },
    { type: "RESET", displayName: "Reset", tooltip: "Reset qubit to |0⟩ state", numQubits: 1 },
    { type: "BARRIER", displayName: "Barrier", tooltip: "Visual circuit barrier", numQubits: 'all' },
  ]
];

// For easier name mapping if needed, or direct use in GatePalette
export const GATE_CATEGORY_NAMES = [
  "Single Qubit: Basic",
  "Single Qubit: Rotations",
  "Single Qubit: Phases",
  "Single Qubit: Universal",
  "Two Qubit Gates",
  "Three Qubit Gates",
  "Measurement & Utility",
];


export const AVAILABLE_GATES: GateSymbol[] = GATE_CATEGORIES.flat().map(gate => gate.type);

export const GATE_INFO_MAP = new Map<GateSymbol, PaletteGateInfo>(
  GATE_CATEGORIES.flat().map(g => [g.type, g])
);

// Predefined circuits for the library
export const PREDEFINED_CIRCUITS: LibraryCategory[] = [
  {
    id: 'basic_states',
    name: 'Basic States',
    circuits: [
      { id: 'bell_phi_plus', name: '|Φ+⟩ Bell State', description: 'Creates the |00⟩ + |11⟩ Bell state.' },
      { id: 'bell_phi_minus', name: '|Φ-⟩ Bell State', description: 'Creates the |00⟩ - |11⟩ Bell state.' },
      { id: 'bell_psi_plus', name: '|Ψ+⟩ Bell State', description: 'Creates the |01⟩ + |10⟩ Bell state.' },
      { id: 'bell_psi_minus', name: '|Ψ-⟩ Bell State', description: 'Creates the |01⟩ - |10⟩ Bell state.' },
      { id: 'ghz_3', name: 'GHZ State (3 Qubits)', description: 'Creates a 3-qubit Greenberger–Horne–Zeilinger state.' },
      { id: 'ghz_4', name: 'GHZ State (4 Qubits)', description: 'Creates a 4-qubit GHZ state.' },
      { id: 'ghz_5', name: 'GHZ State (5 Qubits)', description: 'Creates a 5-qubit GHZ state.' },
      { id: 'w_state_3', name: 'W State (3 Qubits)', description: 'Creates a 3-qubit W state.' },
    ],
  },
  {
    id: 'algorithms',
    name: 'Algorithms',
    circuits: [
      { id: 'qft_3', name: 'Quantum Fourier Transform (3 Qubits)', description: 'Implements QFT for 3 qubits.' },
      { id: 'iqft_3', name: 'Inverse QFT (3 Qubits)', description: 'Implements Inverse QFT for 3 qubits.' },
      { id: 'grover_2', name: "Grover's Search (2 Qubits)", description: "Demonstrates Grover's algorithm for 2 qubits (1 marked item)." },
      { id: 'grover_3', name: "Grover's Search (3 Qubits)", description: "Demonstrates Grover's algorithm for 3 qubits (1 marked item)." },
      { id: 'qpe_3', name: 'Quantum Phase Estimation (3 Qubits)', description: 'Basic Quantum Phase Estimation example.' },
      { id: 'teleportation', name: 'Teleportation Protocol', description: 'Quantum teleportation of a single qubit state.' },
    ],
  },
];
