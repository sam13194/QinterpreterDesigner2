"use client";

import type { VisualCircuit, Gate, GateSymbol } from '@/lib/circuit-types';
import { generateId } from '@/lib/utils';
import { produce } from 'immer';
import { useState, useCallback } from 'react';

const INITIAL_QUBITS = 3;
const MAX_QUBITS = 8; // Max qubits for performance and display reasons
const INITIAL_COLUMNS = 15; // Initial number of time steps (columns)

interface CircuitState extends VisualCircuit {
  numColumns: number;
}

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
          const oldNumQubits = draft.numQubits;
          draft.numQubits -= 1;
          // Remove gates connected to the removed qubit
          draft.gates = draft.gates.filter(gate => 
            !gate.qubits.includes(oldNumQubits - 1)
          );
        }
      })
    );
  }, []);


  const addGate = useCallback((type: GateSymbol, qubits: number[], column: number) => {
    setCircuit(
      produce((draft) => {
        // Basic validation
        if (qubits.some(q => q >= draft.numQubits || q < 0) || column < 0) return;
        if (type === "CNOT" && qubits.length !== 2) return;
        if (type !== "CNOT" && qubits.length !== 1) return;

        // Prevent placing multiple gates on the same qubit in the same column (single qubit gates)
        // Or control/target on the same qubit for CNOT
        if (type === "CNOT") {
          if (qubits[0] === qubits[1]) return; // Control and target cannot be the same
          // Check if control or target qubit is already occupied by another part of a CNOT or a single qubit gate
          const controlOccupied = draft.gates.some(g => g.column === column && g.qubits.includes(qubits[0]));
          const targetOccupied = draft.gates.some(g => g.column === column && g.qubits.includes(qubits[1]));
          if (controlOccupied || targetOccupied) return;
        } else { // Single qubit gate
          const qubitOccupied = draft.gates.some(g => g.column === column && g.qubits.includes(qubits[0]));
          if (qubitOccupied) return;
        }


        const newGate: Gate = { id: generateId(), type, qubits, column };
        draft.gates.push(newGate);
        if (column >= draft.numColumns) {
          draft.numColumns = column + 1;
        }
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
