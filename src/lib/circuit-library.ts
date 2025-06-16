
import type { VisualCircuit } from './circuit-types'; // Will be used later

export interface LibraryCircuitInfo {
  id: string;
  name: string;
  description: string;
  // visualCircuit: VisualCircuit; // To be defined later for actual circuit data
}

export interface LibraryCategory {
  id: string;
  name: string;
  circuits: LibraryCircuitInfo[];
}

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
  // Puertas Personalizadas will be managed dynamically by the user later
  // {
  //   id: 'custom_gates',
  //   name: 'Custom Gates',
  //   circuits: [],
  // },
];
