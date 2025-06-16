
"use client";

import type { VisualCircuit, Gate, GateSymbol, PaletteGateInfo } from '@/lib/circuit-types';
import { GATE_CATEGORIES } from '@/lib/circuit-types';
import { generateId } from '@/lib/utils';
import { produce } from 'immer';
import { useState, useCallback } from 'react';

const INITIAL_QUBITS = 3;
const MAX_QUBITS = 8; 
const INITIAL_COLUMNS = 15;

interface CircuitState extends VisualCircuit {
  numColumns: number;
}

const ALL_PALETTE_GATES: PaletteGateInfo[] = GATE_CATEGORIES.flatMap(cat => cat.gates);
const GATE_INFO_MAP = new Map<GateSymbol, PaletteGateInfo>(ALL_PALETTE_GATES.map(g => [g.type, g]));


export function useCircuitState(initialCircuit?: VisualCircuit) {
  const [circuit, setCircuit] = useState<CircuitState>(() => {
    if (initialCircuit) {
      return {
        ...initialCircuit,
        numQubits: initialCircuit.numQubits || INITIAL_QUBITS,
        numColumns: Math.max(INITIAL_COLUMNS, ...initialCircuit.gates.map(g => g.column + 1), 0) ,
        shots: initialCircuit.shots || 1000,
        name: initialCircuit.name || "Untitled Circuit",
      };
    }
    return {
      numQubits: INITIAL_QUBITS,
      gates: [],
      shots: 1000,
      name: "Untitled Circuit",
      numColumns: INITIAL_COLUMNS,
    };
  });

  const updateCircuitName = useCallback((name: string) => {
    setCircuit(
      produce((draft) => {
        draft.name = name;
      })
    );
  }, []);

  const updateNumShots = useCallback((shots: number) => {
    setCircuit(
      produce((draft) => {
        draft.shots = Math.max(1, shots || 1); // Ensure shots is at least 1
      })
    );
  }, []);

  const updateNumQubits = useCallback((newCountInput: number | string) => {
    setCircuit(
      produce((draft) => {
        let newCount = typeof newCountInput === 'string' ? parseInt(newCountInput, 10) : newCountInput;
        
        if (isNaN(newCount)) { // If parsing fails or input is empty string resulting in NaN
          // Don't change if invalid, or decide on a default recovery (e.g., draft.numQubits)
          // For now, let's keep the current value if input is not a valid number
          return; 
        }

        const validatedCount = Math.max(1, Math.min(newCount, MAX_QUBITS));
        
        if (validatedCount === draft.numQubits) {
            // This ensures if user types e.g. "0", it reverts to 1, or "10" to MAX_QUBITS
            // but if the validatedCount is actually the current, no actual state change,
            // but the controlled input in UI might need to reflect 'validatedCount'.
            // The effect hook in component or simply setting state will handle UI update.
            // If the input was invalid and resulted in no change, draft.numQubits remains.
            // If it was valid but clamped to current value, it also remains.
            // If user typed a value that after validation is same as current, do nothing to gates.
            if (newCount !== validatedCount) { // If original input was out of bounds
                 // No change to draft.numQubits if it's already validatedCount
            } else { // Valid input that equals current numQubits
                return;
            }
        }
        
        // If count is decreasing, remove gates on qubits that will no longer exist
        if (validatedCount < draft.numQubits) {
          draft.gates = draft.gates.filter(gate => 
            gate.qubits.every(q => q < validatedCount)
          );
        }
        // If count is increasing, no gates need to be removed based on qubit indices.
        
        draft.numQubits = validatedCount;
      })
    );
  }, []);


  const addQubit = useCallback(() => {
    setCircuit(
      produce((draft) => {
        if (draft.numQubits < MAX_QUBITS) {
          draft.numQubits += 1;
        }
      })
    );
  }, []);
  
  const removeQubit = useCallback(() => {
    setCircuit(
      produce((draft) => {
        if (draft.numQubits > 1) {
          const newNumQubits = draft.numQubits - 1;
          // Remove gates connected to the qubit that is being removed
          draft.gates = draft.gates.filter(gate => 
            gate.qubits.every(q => q < newNumQubits)
          );
          draft.numQubits = newNumQubits;
        }
      })
    );
  }, []);


  const addGate = useCallback((type: GateSymbol, qubits: number[], column: number) => {
    setCircuit(
      produce((draft) => {
        if (qubits.some(q => q >= draft.numQubits || q < 0) || column < 0 || column >= draft.numColumns) return;

        const gateInfo = GATE_INFO_MAP.get(type);
        if (!gateInfo) return; 

        const expectedQubits = typeof gateInfo.numQubits === 'number' ? gateInfo.numQubits : 0;

        if (gateInfo.numQubits !== 'all' && qubits.length !== expectedQubits) {
          console.error(`Gate ${type} expects ${expectedQubits} qubits, got ${qubits.length}`);
          return;
        }
        
        if (qubits.length > 1 && new Set(qubits).size !== qubits.length) {
            console.error(`Gate ${type} requires distinct qubits.`);
            return;
        }

        const cellsToOccupy = qubits.map(q => ({ qubit: q, column }));
        for (const cell of cellsToOccupy) {
            const occupied = draft.gates.some(g => g.column === cell.column && g.qubits.includes(cell.qubit));
            if (occupied) {
                console.warn(`Cell at qubit ${cell.qubit}, column ${cell.column} is already occupied.`);
                return;
            }
        }
        
        const newGate: Gate = { id: generateId(), type, qubits: [...qubits].sort((a,b) => a-b), column };
        draft.gates.push(newGate);
      })
    );
  }, []);

  const removeGate = useCallback((gateId: string) => {
    setCircuit(
      produce((draft) => {
        draft.gates = draft.gates.filter((gate) => gate.id !== gateId);
      })
    );
  }, []);

  const clearCircuit = useCallback(() => {
    setCircuit(
      produce((draft) => {
        draft.gates = [];
        draft.numQubits = INITIAL_QUBITS;
        draft.numColumns = INITIAL_COLUMNS;
        draft.name = "Untitled Circuit";
        draft.shots = 1000;
      })
    );
  }, []);

  const loadCircuit = useCallback((loadedData: VisualCircuit) => {
    setCircuit(
      produce((draft) => {
        draft.numQubits = loadedData.numQubits || INITIAL_QUBITS;
        draft.gates = loadedData.gates || [];
        draft.shots = loadedData.shots || 1000;
        draft.name = loadedData.name || "Untitled Circuit";
        draft.numColumns = Math.max(INITIAL_COLUMNS, ...(loadedData.gates?.map(g => g.column + 1) || [0]), 0);
      })
    );
  }, []);

  const getFullCircuit = useCallback((): VisualCircuit => {
    return {
      numQubits: circuit.numQubits,
      gates: circuit.gates,
      shots: circuit.shots,
      name: circuit.name,
    };
  }, [circuit]);
  
  const addColumn = useCallback(() => {
    setCircuit(produce(draft => {
      draft.numColumns +=1;
    }));
  }, []);

  return {
    circuit,
    addQubit,
    removeQubit,
    updateNumQubits,
    addGate,
    removeGate,
    clearCircuit,
    loadCircuit,
    getFullCircuit,
    updateCircuitName,
    updateNumShots,
    addColumn,
  };
}

