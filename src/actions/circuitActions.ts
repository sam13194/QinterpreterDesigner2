"use server";

import { suggestNextGate, type SuggestNextGateInput, type SuggestNextGateOutput } from "@/ai/flows/suggest-next-gate";
import type { VisualCircuit } from "@/lib/circuit-types";

function formatCircuitForAI(circuit: VisualCircuit): string {
  let description = `A quantum circuit with ${circuit.numQubits} qubits and ${circuit.gates.length} gates.\n`;
  description += `Circuit Name: ${circuit.name || 'Untitled'}\n`;
  description += `Number of Shots for Simulation: ${circuit.shots || 1000}\n`;
  description += "Gates:\n";
  if (circuit.gates.length === 0) {
    description += "  No gates placed yet.\n";
  } else {
    circuit.gates.forEach(gate => {
      description += `  - ID: ${gate.id}, Type: ${gate.type}, Qubit(s): [${gate.qubits.join(', ')}], Column: ${gate.column}\n`;
    });
  }
  return description;
}


export async function getGateSuggestionAction(
  currentCircuit: VisualCircuit,
  desiredState: string | undefined,
  availableGates: string[]
): Promise<SuggestNextGateOutput | { error: string }> {
  try {
    const circuitDescription = formatCircuitForAI(currentCircuit);
    
    const input: SuggestNextGateInput = {
      circuitDescription,
      desiredState: desiredState || "Not specified, aim for interesting or entangled state.",
      availableGates: availableGates.join(', '),
    };

    const suggestion = await suggestNextGate(input);
    return suggestion;
  } catch (error) {
    console.error("Error getting gate suggestion:", error);
    return { error: "Failed to get gate suggestion. Please try again." };
  }
}
