
"use client";

import type { VisualCircuit, Gate, GateSymbol, PaletteGateInfo, GateParamDetail } from '@/lib/circuit-types';
import { GATE_INFO_MAP } from '@/lib/circuit-types';
import { generateId } from '@/lib/utils';
import { produce } from 'immer';
import { useState, useCallback } from 'react';

const INITIAL_QUBITS = 3;
const MAX_QUBITS = 16; // Increased from 8
const INITIAL_COLUMNS = 15;

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
        draft.shots = Math.max(1, shots || 1);
      })
    );
  }, []);

  const updateNumQubits = useCallback((newCountInput: number | string) => {
    setCircuit(
      produce((draft) => {
        let newCount = typeof newCountInput === 'string' ? parseInt(newCountInput, 10) : newCountInput;
        
        if (isNaN(newCount)) {
          return;
        }

        const validatedCount = Math.max(1, Math.min(newCount, MAX_QUBITS));
        
        if (validatedCount === draft.numQubits && newCount === validatedCount) {
            return;
        }
        
        if (validatedCount < draft.numQubits) {
          // Remove gates on qubits that no longer exist
          draft.gates = draft.gates.filter(gate =>
            gate.qubits.every(q => q < validatedCount)
          );
           // Update multi-qubit gates that might now be invalid
          draft.gates.forEach(gate => {
            if (gate.qubits.some(q => q >= validatedCount)) {
                gate.qubits = gate.qubits.filter(q => q < validatedCount);
                // If a gate becomes invalid (e.g. CNOT needs 2 qubits but now only has 1), remove it
                const gateInfo = GATE_INFO_MAP.get(gate.type);
                if (gateInfo && typeof gateInfo.numQubits === 'number' && gate.qubits.length < gateInfo.numQubits) {
                    draft.gates = draft.gates.filter(g => g.id !== gate.id);
                }
            }
          });
        }
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
          // Filter out gates that were on the removed qubit or exclusively involved it
           draft.gates = draft.gates.filter(gate =>
            gate.qubits.every(q => q < newNumQubits)
          );
          // Update multi-qubit gates that might now be invalid (similar to updateNumQubits)
           draft.gates.forEach(gate => {
            if (gate.qubits.some(q => q >= newNumQubits)) {
                gate.qubits = gate.qubits.filter(q => q < newNumQubits);
                const gateInfo = GATE_INFO_MAP.get(gate.type);
                if (gateInfo && typeof gateInfo.numQubits === 'number' && gate.qubits.length < gateInfo.numQubits) {
                     draft.gates = draft.gates.filter(g => g.id !== gate.id);
                }
            }
          });
          draft.numQubits = newNumQubits;
        }
      })
    );
  }, []);


  const addGate = useCallback((type: GateSymbol, qubits: number[], column: number) => {
    setCircuit(
      produce((draft) => {
        if (qubits.some(q => q >= draft.numQubits || q < 0) && type !== "BARRIER" && type !== "MEASURE_ALL") return;
        if (column < 0 || column >= draft.numColumns) return;


        const gateInfo = GATE_INFO_MAP.get(type);
        if (!gateInfo) return;

        let finalQubits = [...qubits];

        if (gateInfo.numQubits === 'all') {
          finalQubits = Array.from({length: draft.numQubits}, (_,i) => i);
        } else {
            const expectedQubits = typeof gateInfo.numQubits === 'number' ? gateInfo.numQubits : 0;
            if (finalQubits.length !== expectedQubits) {
              console.error(`Gate ${type} expects ${expectedQubits} qubits, got ${finalQubits.length}`);
              return;
            }
            if (finalQubits.length > 1 && new Set(finalQubits).size !== finalQubits.length) {
                console.error(`Gate ${type} requires distinct qubits.`);
                return;
            }
        }
        
        // For non-barrier gates, check for occupation
        if (type !== "BARRIER") {
            const cellsToOccupy = finalQubits.map(q => ({ qubit: q, column }));
            for (const cell of cellsToOccupy) {
                const occupiedByOtherGate = draft.gates.some(g => g.column === cell.column && g.qubits.includes(cell.qubit) && g.type !== "BARRIER");
                if (occupiedByOtherGate) {
                    console.warn(`Cell at qubit ${cell.qubit}, column ${cell.column} is already occupied by a non-barrier gate.`);
                    return;
                }
            }
        } else { // For BARRIER, check if a barrier already exists in this column
            const existingBarrier = draft.gates.some(g => g.column === column && g.type === "BARRIER");
            if (existingBarrier) {
                console.warn(`Column ${column} already has a BARRIER.`);
                return;
            }
        }
        
        const newGate: Gate = {
            id: generateId(),
            type,
            qubits: finalQubits.sort((a,b) => a-b),
            column
        };

        if (gateInfo.paramDetails && gateInfo.paramDetails.length > 0) {
            newGate.params = {};
            gateInfo.paramDetails.forEach(pDetail => {
                if (newGate.params) { 
                    newGate.params[pDetail.name] = pDetail.defaultValue;
                }
            });
        }
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

  const updateGateParam = useCallback((gateId: string, paramName: string, paramValue: string | number) => {
    setCircuit(produce(draft => {
      const gate = draft.gates.find(g => g.id === gateId);
      if (gate) {
        if (!gate.params) {
          gate.params = {};
        }
        const gateInfo = GATE_INFO_MAP.get(gate.type);
        const paramDetail = gateInfo?.paramDetails?.find(p => p.name === paramName);

        if (paramDetail?.type === 'angle' || paramDetail?.type === 'number') {
          const numValue = parseFloat(paramValue as string);
          gate.params[paramName] = isNaN(numValue) ? (paramDetail.defaultValue !== undefined ? paramDetail.defaultValue : 0) : numValue;
        } else {
          gate.params[paramName] = paramValue;
        }
      }
    }));
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
        draft.numQubits = Math.min(loadedData.numQubits || INITIAL_QUBITS, MAX_QUBITS) ;
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
    updateGateParam,
    clearCircuit,
    loadCircuit,
    getFullCircuit,
    updateCircuitName,
    updateNumShots,
    addColumn,
  };
}
