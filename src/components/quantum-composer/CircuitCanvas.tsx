"use client";

import type { Gate, GateSymbol, VisualCircuit } from "@/lib/circuit-types";
import { CircuitGridCell } from "./CircuitGridCell";
import { GateIcon } from "./GateIcon";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle, Trash2, GitCommitHorizontal } from "lucide-react";
import React, { useState, useCallback, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface CircuitCanvasProps {
  circuit: VisualCircuit & { numColumns: number };
  onAddQubit: () => void;
  onRemoveQubit: () => void;
  onAddGate: (type: GateSymbol, qubits: number[], column: number) => void;
  onRemoveGate: (gateId: string) => void;
  onAddColumn: () => void;
}

const CELL_WIDTH = 64; // Corresponds to w-16
const CELL_HEIGHT = 64; // Corresponds to h-16

export function CircuitCanvas({
  circuit,
  onAddQubit,
  onRemoveQubit,
  onAddGate,
  onRemoveGate,
  onAddColumn,
}: CircuitCanvasProps) {
  const { numQubits, gates, numColumns } = circuit;
  const [pendingCNOT, setPendingCNOT] = useState<{ type: GateSymbol; column: number; controlQubit: number } | null>(null);

  const handleDrop = (targetQubit: number, column: number, gateTypeString: string) => {
    const gateType = gateTypeString as GateSymbol;

    if (pendingCNOT && gateType === "CNOT") { // Placing CNOT target
      if (targetQubit !== pendingCNOT.controlQubit) {
        onAddGate(pendingCNOT.type, [pendingCNOT.controlQubit, targetQubit].sort((a,b) => a-b) , pendingCNOT.column);
      }
      setPendingCNOT(null);
    } else if (gateType === "CNOT") { // Placing CNOT control
      setPendingCNOT({ type: gateType, column, controlQubit: targetQubit });
      // TODO: Add visual cue for pending CNOT target selection
    } else { // Single qubit gate
      onAddGate(gateType, [targetQubit], column);
      setPendingCNOT(null); // Clear pending CNOT if another gate is dropped
    }
  };
  
  const handleCellClick = (q: number, c: number) => {
    if (pendingCNOT) {
       if (q !== pendingCNOT.controlQubit) {
        onAddGate(pendingCNOT.type, [pendingCNOT.controlQubit, q].sort((a,b) => a-b), pendingCNOT.column);
      }
      setPendingCNOT(null);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPendingCNOT(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const getGateAt = (qubit: number, column: number): Gate | undefined => {
    return gates.find(g => g.column === column && g.qubits.includes(qubit));
  };
  
  const isCellOccupied = (qubit: number, column: number): boolean => {
    return !!getGateAt(qubit, column);
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-inner overflow-auto h-full flex flex-col items-start">
      <div className="flex items-center mb-4 space-x-2">
        <Button onClick={onAddQubit} variant="outline" size="sm" aria-label="Add Qubit">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Qubit
        </Button>
        <Button onClick={onRemoveQubit} variant="outline" size="sm" disabled={numQubits <=1} aria-label="Remove Qubit">
          <MinusCircle className="mr-2 h-4 w-4" /> Remove Qubit
        </Button>
         <Button onClick={onAddColumn} variant="outline" size="sm" aria-label="Add Time Step">
          <GitCommitHorizontal className="mr-2 h-4 w-4 transform rotate-90" /> Add Time Step
        </Button>
        {pendingCNOT && (
          <div className="ml-4 p-2 bg-accent/20 text-accent-foreground rounded-md text-sm">
            Placing CNOT: Click target qubit for control qubit Q{pendingCNOT.controlQubit} at column {pendingCNOT.column}. (Press Esc to cancel)
          </div>
        )}
      </div>

      <div className="relative" style={{ minWidth: `${numColumns * CELL_WIDTH + 60}px` }}>
        {/* Render Qubit Labels and Lines */}
        {Array.from({ length: numQubits }).map((_, qIndex) => (
          <div
            key={`qubit-row-${qIndex}`}
            className="flex items-center"
            style={{ height: `${CELL_HEIGHT}px` }}
          >
            <div className="w-12 text-sm text-muted-foreground font-mono select-none sticky left-0 bg-card z-10">
              Q{qIndex}:
            </div>
            <div
              className="absolute bg-muted-foreground/50 h-px"
              style={{
                top: `${qIndex * CELL_HEIGHT + CELL_HEIGHT / 2 -1}px`,
                left: `${CELL_WIDTH / 2 + 48}px`, // Start line after label
                width: `${numColumns * CELL_WIDTH}px`, // Extend through all columns
                zIndex: 0,
              }}
            />
          </div>
        ))}

        {/* Render Grid Cells */}
        <div className="absolute top-0 left-12 grid" style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
          {Array.from({ length: numQubits }).map((_, qIndex) =>
            Array.from({ length: numColumns }).map((_, cIndex) => (
              <div key={`cell-${qIndex}-${cIndex}`} onClick={() => handleCellClick(qIndex, cIndex)} className={cn(pendingCNOT && "cursor-crosshair")}>
                <CircuitGridCell
                  qubit={qIndex}
                  column={cIndex}
                  onDrop={handleDrop}
                  isOccupied={isCellOccupied(qIndex, cIndex) && getGateAt(qIndex, cIndex)?.type !== "CNOT"} // CNOT cells are somewhat special
                >
                  {/* Gate rendering is handled below to allow for multi-qubit gates like CNOT lines */}
                </CircuitGridCell>
              </div>
            ))
          )}
        </div>
        
        {/* Render Gates */}
        {gates.map((gate) => {
          const gateTop = gate.qubits[0] * CELL_HEIGHT + (CELL_HEIGHT - 40) / 2; // 40 is gate height
          const gateLeft = 48 + gate.column * CELL_WIDTH + (CELL_WIDTH - 40) / 2; // 48 is label width, 40 is gate width

          if (gate.type === "CNOT") {
            const controlQubit = Math.min(gate.qubits[0], gate.qubits[1]);
            const targetQubit = Math.max(gate.qubits[0], gate.qubits[1]);
            
            const controlTop = controlQubit * CELL_HEIGHT + (CELL_HEIGHT - 16) / 2; // 16 is control dot height
            const controlLeft = 48 + gate.column * CELL_WIDTH + (CELL_WIDTH - 16) / 2; // 16 is control dot width

            const targetTop = targetQubit * CELL_HEIGHT + (CELL_HEIGHT - 32) / 2; // 32 is target icon height
            const targetLeft = 48 + gate.column * CELL_WIDTH + (CELL_WIDTH - 32) / 2; // 32 is target icon width
            
            return (
              <React.Fragment key={gate.id}>
                {/* Connecting Line */}
                <div
                  className="absolute bg-accent z-0"
                  style={{
                    top: `${controlTop + 8}px`, // 8 is half of control dot height
                    left: `${controlLeft + 7}px`, // 7 is half of control dot width minus half line width
                    width: '2px',
                    height: `${(targetQubit - controlQubit) * CELL_HEIGHT - 8 + 8}px`, // From center of control to center of target
                  }}
                />
                {/* Control Dot */}
                 <div
                  className="absolute z-10"
                  style={{ top: `${controlTop}px`, left: `${controlLeft}px` }}
                >
                  <GateIcon type="CNOT" isControl className="cursor-pointer" onClick={() => onRemoveGate(gate.id)} title={`Remove CNOT ${gate.id}`}/>
                </div>
                {/* Target XOR */}
                <div
                  className="absolute z-10"
                  style={{ top: `${targetTop}px`, left: `${targetLeft}px` }}
                >
                 <GateIcon type="CNOT" isTarget className="cursor-pointer" onClick={() => onRemoveGate(gate.id)} title={`Remove CNOT ${gate.id}`}/>
                </div>
              </React.Fragment>
            );
          } else { // Single Qubit Gate
            return (
              <div
                key={gate.id}
                className="absolute z-10"
                style={{ top: `${gateTop}px`, left: `${gateLeft}px` }}
              >
                <div className="relative group">
                  <GateIcon type={gate.type} title={`Gate: ${gate.type}, Qubit: ${gate.qubits[0]}, Col: ${gate.column}`} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-3 -right-3 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full"
                    onClick={() => onRemoveGate(gate.id)}
                    aria-label={`Remove ${gate.type} gate`}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
