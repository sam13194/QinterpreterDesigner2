export type GateSymbol = "H" | "X" | "Y" | "Z" | "CNOT" | "MEASURE";

export interface Gate {
  id: string;
  type: GateSymbol;
  qubits: number[]; // For single-qubit gates, this is [targetQubit]. For CNOT, this is [controlQubit, targetQubit].
  column: number; // Time step
  name?: string; // Optional name for the gate instance
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

// Available gates for the palette and AI suggestions
export const AVAILABLE_GATES: GateSymbol[] = ["H", "X", "Y", "Z", "CNOT", "MEASURE"];
