
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
        draft.shots = shots;
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
          const removedQubitIndex = draft.numQubits - 1;
          draft.numQubits -= 1;
          // Remove gates connected to the removed qubit or adjust multi-qubit gates
          draft.gates = draft.gates.filter(gate => 
            !gate.qubits.includes(removedQubitIndex)
          ).map(gate => {
            // If a gate involved more qubits than now available, it might become invalid.
            // For simplicity now, we just filter. A more robust solution might transform/remove them.
            if (gate.qubits.some(q => q >= draft.numQubits)) {
                // This case should ideally not happen if filtering is done right.
                // Or, we might need to invalidate/remove such gates.
                // For now, assume filter is enough if a qubit is just removed from the end.
            }
            return gate;
          });
        }
      })
    );
  }, []);


  const addGate = useCallback((type: GateSymbol, qubits: number[], column: number) => {
    setCircuit(
      produce((draft) => {
        if (qubits.some(q => q >= draft.numQubits || q < 0) || column < 0 || column >= draft.numColumns) return;

        const gateInfo = GATE_INFO_MAP.get(type);
        if (!gateInfo) return; // Unknown gate type

        const expectedQubits = typeof gateInfo.numQubits === 'number' ? gateInfo.numQubits : 0; // 'all' case not handled here

        if (gateInfo.numQubits !== 'all' && qubits.length !== expectedQubits) {
          console.error(`Gate ${type} expects ${expectedQubits} qubits, got ${qubits.length}`);
          return;
        }
        
        // Ensure distinct qubits if gate requires it (most multi-qubit gates)
        if (qubits.length > 1 && new Set(qubits).size !== qubits.length) {
            console.error(`Gate ${type} requires distinct qubits.`);
            return;
        }

        // Check for occupation
        const cellsToOccupy = qubits.map(q => ({ qubit: q, column }));
        for (const cell of cellsToOccupy) {
            const occupied = draft.gates.some(g => g.column === cell.column && g.qubits.includes(cell.qubit));
            if (occupied) {
                console.warn(`Cell at qubit ${cell.qubit}, column ${cell.column} is already occupied.`);
                return;
            }
        }
        
        // For 'MEASURE_ALL', qubits array will be dynamically generated if needed, or handled differently.
        // For this function, assume 'qubits' is correctly populated for 'MEASURE_ALL' if it reaches here.
        if (type === 'MEASURE_ALL') {
             // For MEASURE_ALL, we create one gate entry but it applies to all.
             // The rendering logic will handle its special nature.
             // Qubits array could be all current qubits, e.g. Array.from({length: draft.numQubits}, (_,i) => i)
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
        draft.numColumns = Math.max(INITIAL_COLUMNS, ...loadedData.gates.map(g => g.column + 1), 0);
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

