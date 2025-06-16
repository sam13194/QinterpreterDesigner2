import { type NextRequest, NextResponse } from 'next/server';
import type { VisualCircuit } from '@/lib/circuit-types';

export async function POST(request: NextRequest) {
  try {
    const circuit = (await request.json()) as VisualCircuit;
    
    // In a real app, you'd convert `circuit` and run simulation with Qiskit/Qinterpreter.
    // For MVP, return mock data based on the circuit structure.
    const numQubits = circuit.numQubits;
    const shots = circuit.shots || 1000;
    let mockCounts: { [key: string]: number } = {};

    if (numQubits === 0) {
        return NextResponse.json({ counts: {} });
    }
    
    // Example: if H on Q0 and CNOT Q0 (control), Q1 (target) for 2 qubits (Bell state |00> + |11>)
    const hasHadamardQ0 = circuit.gates.some(g => g.type === 'H' && g.qubits.includes(0) && g.column === 0);
    const hasCNOTQ0Q1 = circuit.gates.some(g => g.type === 'CNOT' && g.qubits.includes(0) && g.qubits.includes(1) && g.column === 1);

    if (numQubits === 2 && hasHadamardQ0 && hasCNOTQ0Q1) {
        mockCounts = {
            "00": Math.floor(shots / 2) + (shots % 2), // Distribute remainder
            "11": Math.floor(shots / 2),
        };
    } else if (numQubits > 0) { // Generic mock data for other cases
        const possibleStates = Math.pow(2, numQubits);
        let remainingShots = shots;
        
        // Give a few random states some counts
        const numActiveStates = Math.max(1, Math.min(possibleStates, Math.floor(Math.random() * 4) + 1)); // 1 to 4 active states
        const activeStateIndices = new Set<number>();
        while(activeStateIndices.size < numActiveStates && activeStateIndices.size < possibleStates) {
            activeStateIndices.add(Math.floor(Math.random() * possibleStates));
        }

        const statesToDistribute = Array.from(activeStateIndices);
        if (statesToDistribute.length === 0 && possibleStates > 0) { // Ensure at least one state if possible
             statesToDistribute.push(0);
        }


        statesToDistribute.forEach((stateIndex, idx) => {
            const stateKey = stateIndex.toString(2).padStart(numQubits, '0');
            if (idx === statesToDistribute.length - 1) { // Last state gets all remaining shots
                mockCounts[stateKey] = remainingShots;
            } else {
                const stateShots = Math.floor(Math.random() * remainingShots / 2) +1;
                mockCounts[stateKey] = Math.min(remainingShots, stateShots);
                remainingShots -= mockCounts[stateKey];
            }
        });
        
        // Ensure total shots add up
        let currentTotal = Object.values(mockCounts).reduce((s, c) => s + c, 0);
        if (currentTotal !== shots && Object.keys(mockCounts).length > 0) {
            const firstState = Object.keys(mockCounts)[0];
            mockCounts[firstState] += (shots - currentTotal);
            if(mockCounts[firstState] < 0) mockCounts[firstState] = 0; // Prevent negative
        } else if (Object.keys(mockCounts).length === 0 && numQubits > 0) { // If somehow no states, assign all to '0...0'
            mockCounts["0".repeat(numQubits)] = shots;
        }

    }

    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    return NextResponse.json({ counts: mockCounts });
  } catch (error) {
    let errorMessage = "Failed to simulate circuit.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("Simulation error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
