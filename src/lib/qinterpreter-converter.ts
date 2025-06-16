
import type { VisualCircuit, Gate, GateSymbol } from './circuit-types';
import { GATE_INFO_MAP } from './circuit-types';

// Helper to format parameters for QuantumGate constructor
function formatGateParamsList(gate: Gate): string {
  const gateInfo = GATE_INFO_MAP.get(gate.type);

  // If the gate type has no parameter details in GATE_INFO_MAP, omit params argument
  if (!gateInfo || !gateInfo.paramDetails || gateInfo.paramDetails.length === 0) {
    return "";
  }

  // If paramDetails exist, always provide the params list, using defaults if necessary
  const paramValues = gateInfo.paramDetails.map(pDetail => {
    const value = gate.params ? gate.params[pDetail.name] : undefined;
    const valToUse = value !== undefined ? value : pDetail.defaultValue;

    if (typeof valToUse === 'number') {
      const pi = Math.PI;
      // Check for common multiples of pi first
      if (Math.abs(valToUse - pi) < 0.001) return 'math.pi';
      if (Math.abs(valToUse - pi / 2) < 0.001) return 'math.pi/2';
      if (Math.abs(valToUse + pi / 2) < 0.001) return '-math.pi/2'; // Support negative common fractions
      if (Math.abs(valToUse - pi / 4) < 0.001) return 'math.pi/4';
      if (Math.abs(valToUse + pi / 4) < 0.001) return '-math.pi/4';
      if (Math.abs(valToUse - 2 * pi) < 0.001) return '2*math.pi';
      if (Math.abs(valToUse + 2 * pi) < 0.001) return '-2*math.pi';
      // Fallback to numeric value, ensuring it's not unnecessarily long
      const fixed = valToUse.toFixed(4);
      return parseFloat(fixed).toString(); // Removes trailing zeros like .0000 or .1200
    }
    return `"${valToUse.toString()}"`; // For string params, though not common in QGates
  });

  return `, [${paramValues.join(', ')}]`;
}

// Maps visual gate symbols to Qinterpreter QuantumGate names
const gateTypeToQinterpreterName = (type: GateSymbol): string => {
  switch (type) {
    case 'PHASE': return 'P';
    case 'CPHASE': return 'CP'; // Qinterpreter doc uses CPHASE directly, but example has 'CPHASE' for QuantumGate name, params [phi]
    case 'TOFFOLI': return 'TOFFOLI'; // Qinterpreter supports TOFFOLI, CCX is an alias
    case 'FREDKIN': return 'CSWAP'; // Typically Fredkin is CSWAP
    case 'SDG': return 'Sdg';
    case 'TDG': return 'Tdg';
    case 'CNOT': return 'CNOT'; // CX is an alias in Qinterpreter
    // For U1, U2, U3, Qinterpreter docs don't explicitly list them.
    // We assume they map directly or would need decomposition.
    // For now, map to their uppercase names.
    case 'U1': return 'U1';
    case 'U2': return 'U2';
    case 'U3': return 'U3';
    // Default to uppercase if not specially mapped. This covers H, X, Y, Z, S, T, RX, RY, RZ etc.
    default: return type.toUpperCase();
  }
};

export function visualCircuitToQinterpreterCode(circuit: VisualCircuit): string {
  let code = `from quantumgateway.quantum_circuit import QuantumCircuit, QuantumGate\n`;
  code += `import math  # For math.pi if used in parameters\n\n`;
  code += `from quantumgateway.main import translate_to_framework, simulate_circuit, bloch_sphere # Main functions\n\n`;


  code += `# Circuit Details:\n`;
  code += `# Name: ${circuit.name || 'Untitled Circuit'}\n`;
  code += `# Qubits: ${circuit.numQubits}\n`;
  code += `# Shots for simulation (used in example command): ${circuit.shots || 1000}\n\n`;
  
  code += `# Circuit Initialization\n`;
  code += `qc = QuantumCircuit(${circuit.numQubits}, ${circuit.numQubits})  # num_qubits, num_classical_bits (measuring qubit i to classical bit i)\n\n`;

  code += `# Gates (Sorted by column, then by lowest qubit index)\n`;
  const sortedGates = [...circuit.gates].sort((a, b) => {
    if (a.column !== b.column) {
      return a.column - b.column;
    }
    const minAQubit = Math.min(...a.qubits);
    const minBQubit = Math.min(...b.qubits);
    if (minAQubit !== minBQubit) {
        return minAQubit - minBQubit;
    }
    return a.type.localeCompare(b.type);
  });

  let lastColumnProcessed = -1;
  sortedGates.forEach(gate => {
    if (gate.column > lastColumnProcessed && lastColumnProcessed !== -1 && gate.type !== "BARRIER") {
        code += "\n"; // Add a newline for better readability between distinct steps, unless it's a barrier
    }
    
    if (gate.type === "BARRIER") {
      code += `# Barrier at column ${gate.column} (ignored by Qinterpreter simulation, visual only)\n`;
      // Qinterpreter doesn't have a direct 'barrier' gate, it's a visualizer concept.
      // So we don't add any actual gate to `qc`.
      lastColumnProcessed = gate.column;
      return; 
    }
    
    lastColumnProcessed = gate.column;

    if (gate.type === "MEASURE_ALL") {
        code += `# Measure all qubits (column ${gate.column})\n`;
        for (let i = 0; i < circuit.numQubits; i++) {
            // Measure qubit i to classical bit i
            code += `qc.add_gate(QuantumGate("MEASURE", [${i}, ${i}]))\n`;
        }
        return;
    }
    
    const qGateName = gateTypeToQinterpreterName(gate.type);
    const qGateQubits = `[${gate.qubits.join(', ')}]`;
    
    let qGateParamsString = "";
    if (gate.type === "MEASURE") { // Single measure gate
        // Measure qubit gate.qubits[0] to classical bit gate.qubits[0]
        const qubitToMeasure = gate.qubits[0];
        const classicalBit = qubitToMeasure; // Default mapping
        code += `qc.add_gate(QuantumGate("MEASURE", [${qubitToMeasure}, ${classicalBit}]))  # Column ${gate.column}\n`;
        return; // Handled MEASURE, skip generic param formatting
    } else {
        qGateParamsString = formatGateParamsList(gate);
    }

    code += `qc.add_gate(QuantumGate("${qGateName}", ${qGateQubits}${qGateParamsString}))  # Column ${gate.column}\n`;
  });

  if (sortedGates.filter(g => g.type !== "BARRIER").length === 0) {
    code += `# No operational gates in the circuit.\n`;
  }

  code += `\n# --- Example Qinterpreter Commands (uncomment to use) ---\n`;
  code += `# 1. Simulate the circuit (e.g., using Qiskit):\n`;
  code += `# results = simulate_circuit(qc, "qiskit")\n`;
  code += `# print(f"Simulation Results (Counts for ${circuit.shots || 1000} shots): {{results}}")\n\n`;
  
  code += `# 2. Translate to another framework (e.g., Cirq) and print:\n`;
  code += `# cirq_qc = translate_to_framework(qc, "cirq")\n`;
  code += `# print("\\nCirq circuit representation:")\n`;
  code += `# print(cirq_qc)\n\n`;

  code += `# 3. Visualize states on Bloch spheres (if applicable, typically before measurement):\n`;
  code += `# print("\\nDisplaying Bloch spheres (execution might open new windows)...")\n`;
  code += `# bloch_sphere(qc)\n\n`;
  
  code += `# Note: For statevector simulations or Bloch spheres, measurements might alter results or not be applicable.\n`;
  code += `# Consider commenting out MEASURE gates if you want to inspect the pure statevector before collapse.\n`;

  return code;
}

