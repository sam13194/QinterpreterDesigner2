
import type { VisualCircuit, Gate, GateSymbol } from './circuit-types';
import { GATE_INFO_MAP } from './circuit-types';

function formatGateParamsList(gate: Gate): string {
  if (!gate.params || Object.keys(gate.params).length === 0) {
    return "";
  }
  const gateInfo = GATE_INFO_MAP.get(gate.type);
  if (!gateInfo || !gateInfo.paramDetails) return "";

  const paramValues = gateInfo.paramDetails.map(pDetail => {
    const value = gate.params![pDetail.name];
    const valToUse = value !== undefined ? value : pDetail.defaultValue;

    if (typeof valToUse === 'number') {
      const pi = Math.PI;
      if (Math.abs(valToUse - pi) < 0.001) return 'math.pi';
      if (Math.abs(valToUse - pi / 2) < 0.001) return 'math.pi/2';
      if (Math.abs(valToUse + pi / 2) < 0.001) return '-math.pi/2';
      if (Math.abs(valToUse - pi / 4) < 0.001) return 'math.pi/4';
      if (Math.abs(valToUse + pi / 4) < 0.001) return '-math.pi/4';
      if (Math.abs(valToUse - 2 * pi) < 0.001) return '2*math.pi';
      if (Math.abs(valToUse + 2 * pi) < 0.001) return '-2*math.pi';
      return valToUse.toFixed(4).replace(/\.?0+$/, ""); // Keep up to 4 decimal places, remove trailing zeros
    }
    return `"${valToUse.toString()}"`; 
  });

  if (paramValues.length === 0) return "";
  return `, [${paramValues.join(', ')}]`;
}

const gateTypeToQinterpreterName = (type: GateSymbol): string => {
  switch (type) {
    case 'PHASE': return 'P';
    case 'CPHASE': return 'CP';
    case 'TOFFOLI': return 'CCX';
    case 'FREDKIN': return 'CSWAP';
    case 'SDG': return 'Sdg';
    case 'TDG': return 'Tdg';
    // Ensure all gate types are appropriately mapped if their Qinterpreter name differs.
    // Default to uppercase if not specially mapped.
    default: return type.toUpperCase();
  }
};

export function visualCircuitToQinterpreterCode(circuit: VisualCircuit): string {
  let code = `from quantumgateway.quantum_circuit import QuantumCircuit, QuantumGate\n`;
  code += `import math  # For math.pi if used in parameters\n\n`;

  code += `# Circuit Details:\n`;
  code += `# Name: ${circuit.name || 'Untitled Circuit'}\n`;
  code += `# Qubits: ${circuit.numQubits}\n`;
  code += `# Shots: ${circuit.shots || 1000}\n\n`;
  
  code += `# Circuit Initialization\n`;
  code += `qc = QuantumCircuit(${circuit.numQubits}, ${circuit.numQubits})  # Assuming classical bits = qubits\n\n`;

  code += `# Gates (Sorted by column, then by lowest qubit index)\n`;
  const sortedGates = [...circuit.gates].sort((a, b) => {
    if (a.column !== b.column) {
      return a.column - b.column;
    }
    // For tie-breaking within a column, sort by the minimum qubit index involved in the gate
    const minAQubit = Math.min(...a.qubits);
    const minBQubit = Math.min(...b.qubits);
    if (minAQubit !== minBQubit) {
        return minAQubit - minBQubit;
    }
    // If min qubits are same (e.g. multi-qubit gate vs single on same primary qubit), sort by type for stability
    return a.type.localeCompare(b.type);
  });

  let lastColumnProcessed = -1;
  sortedGates.forEach(gate => {
    if (gate.column > lastColumnProcessed && lastColumnProcessed !== -1) {
        code += "\n"; 
    }
    lastColumnProcessed = gate.column;

    if (gate.type === "BARRIER") {
      code += `# Barrier at column ${gate.column}\n`;
      return;
    }
    
    if (gate.type === "MEASURE_ALL") {
        for (let i = 0; i < circuit.numQubits; i++) {
            code += `qc.add_gate(QuantumGate("MEASURE", [${i}]))  # Column ${gate.column}\n`;
        }
        return;
    }
    
    const qGateName = gateTypeToQinterpreterName(gate.type);
    const qGateQubits = `[${gate.qubits.join(', ')}]`;
    const qGateParamsString = formatGateParamsList(gate);

    code += `qc.add_gate(QuantumGate("${qGateName}", ${qGateQubits}${qGateParamsString}))  # Column ${gate.column}\n`;
  });

  if (sortedGates.length === 0) {
    code += `# No gates in the circuit.\n`;
  }

  code += `\n# --- Example Qinterpreter Commands ---\n`;
  code += `# Simulate the circuit:\n`;
  code += `# results = simulate_circuit(qc, backend_name="qiskit_simulator", num_shots=${circuit.shots || 1000})\n`;
  code += `# print("Simulation Results (Counts):", results.get('counts'))\n\n`;
  
  code += `# Get statevector (if supported by backend and no measurements):\n`;
  code += `# statevector_results = simulate_circuit(qc, backend_name="statevector_simulator")\n`;
  code += `# print("Statevector:", statevector_results.get('statevector'))\n\n`;

  code += `# Visualize Bloch spheres (if Qinterpreter has such a utility):\n`;
  code += `# bloch_figures = bloch_sphere_plotter(qc) # Hypothetical function\n`;
  code += `# if bloch_figures:\n`;
  code += `#   for i, fig in enumerate(bloch_figures):\n`;
  code += `#     fig.show() # or save to file\n`;

  return code;
}
