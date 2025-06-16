
"use client";

import type { Gate, GateSymbol, VisualCircuit, PaletteGateInfo } from "@/lib/circuit-types";
import { GATE_CATEGORIES } from "@/lib/circuit-types";
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

const CELL_WIDTH = 64; 
const CELL_HEIGHT = 64;

interface PendingMultiQubitGate {
  gateInfo: PaletteGateInfo;
  column: number;
  collectedQubits: number[];
}

const ALL_PALETTE_GATES_MAP = new Map<GateSymbol, PaletteGateInfo>(
  GATE_CATEGORIES.flatMap(cat => cat.gates).map(g => [g.type, g])
);

// Helper function to create the delete button wrapper
const createDeletableGateIcon = (
    gateId: string,
    onRemoveGate: (id: string) => void,
    iconProps: Omit<React.ComponentProps<typeof GateIcon>, 'onClick'>,
    keySuffix: string = "main"
) => (
    <div className="relative group" key={`${gateId}-${keySuffix}`}>
        <GateIcon {...iconProps} />
        <Button
            variant="ghost" size="icon"
            className="absolute -top-3 -right-3 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full z-20"
            onClick={() => onRemoveGate(gateId)}
            aria-label={`Remove ${iconProps.type || 'gate'} gate`}
        >
            <Trash2 size={12} />
        </Button>
    </div>
);


export function CircuitCanvas({
  circuit,
  onAddQubit,
  onRemoveQubit,
  onAddGate,
  onRemoveGate,
  onAddColumn,
}: CircuitCanvasProps) {
  const { numQubits, gates, numColumns } = circuit;
  const [pendingMultiQubitGate, setPendingMultiQubitGate] = useState<PendingMultiQubitGate | null>(null);

  const handleDrop = (targetQubit: number, column: number, gateInfoJSON: string) => {
    try {
      const gateInfo = JSON.parse(gateInfoJSON) as PaletteGateInfo;
      if (!gateInfo || !gateInfo.type || typeof gateInfo.numQubits === 'undefined') {
        console.error("Invalid gateInfo received on drop:", gateInfoJSON);
        return;
      }
      
      setPendingMultiQubitGate(null); 

      if (gateInfo.numQubits === 1) {
        onAddGate(gateInfo.type, [targetQubit], column);
      } else if (gateInfo.numQubits === 'all') { 
         if (gateInfo.type === 'MEASURE_ALL') {
           const allQubits = Array.from({length: numQubits}, (_,i) => i);
           onAddGate(gateInfo.type, allQubits, column);
         } else {
            console.warn("Unhandled 'all' qubit gate type:", gateInfo.type);
         }
      } 
      else if (typeof gateInfo.numQubits === 'number' && gateInfo.numQubits > 1) {
        setPendingMultiQubitGate({ gateInfo, column, collectedQubits: [targetQubit] });
      }
    } catch (error) {
        console.error("Error processing dropped gate info:", error);
    }
  };
  
  const handleCellClick = (q: number, c: number) => {
    if (pendingMultiQubitGate && pendingMultiQubitGate.column === c) {
      if (pendingMultiQubitGate.collectedQubits.includes(q) || isCellOccupiedByNonPending(q, c, pendingMultiQubitGate.gateInfo.type)) {
        return;
      }

      const updatedCollectedQubits = [...pendingMultiQubitGate.collectedQubits, q];
      const requiredQubits = pendingMultiQubitGate.gateInfo.numQubits as number; 

      if (updatedCollectedQubits.length === requiredQubits) {
        onAddGate(pendingMultiQubitGate.gateInfo.type, updatedCollectedQubits.sort((a,b)=>a-b), pendingMultiQubitGate.column);
        setPendingMultiQubitGate(null);
      } else {
        setPendingMultiQubitGate(prev => prev ? {...prev, collectedQubits: updatedCollectedQubits} : null);
      }
    } else if (pendingMultiQubitGate && pendingMultiQubitGate.column !== c) {
        setPendingMultiQubitGate(null);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPendingMultiQubitGate(null);
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

  const isCellOccupiedByNonPending = (qubit: number, column: number, pendingGateType: GateSymbol): boolean => {
    const gate = getGateAt(qubit, column);
    if (!gate) return false;
    return true; 
  };
  
  const getPendingFeedbackMessage = (): string | null => {
    if (!pendingMultiQubitGate) return null;
    const { gateInfo, collectedQubits } = pendingMultiQubitGate;
    const required = gateInfo.numQubits as number;
    const remaining = required - collectedQubits.length;
    if (remaining > 0) {
      return `Placing ${gateInfo.displayName || gateInfo.type}: Click ${remaining} more qubit(s) in column ${pendingMultiQubitGate.column}. (Esc to cancel)`;
    }
    return null;
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
        {getPendingFeedbackMessage() && (
          <div className="ml-4 p-2 bg-accent/20 text-accent-foreground rounded-md text-sm">
            {getPendingFeedbackMessage()}
          </div>
        )}
      </div>

      <div className="relative" style={{ minWidth: `${numColumns * CELL_WIDTH + 60}px` }}>
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
                left: `${CELL_WIDTH / 2 + 48}px`,
                width: `${numColumns * CELL_WIDTH}px`,
                zIndex: 0,
              }}
            />
          </div>
        ))}

        <div className="absolute top-0 left-12 grid" style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
          {Array.from({ length: numQubits }).map((_, qIndex) =>
            Array.from({ length: numColumns }).map((_, cIndex) => (
              <div key={`cell-${qIndex}-${cIndex}`} onClick={() => handleCellClick(qIndex, cIndex)} className={cn(pendingMultiQubitGate && pendingMultiQubitGate.column === cIndex && "cursor-crosshair")}>
                <CircuitGridCell
                  qubit={qIndex}
                  column={cIndex}
                  onDrop={handleDrop}
                  isOccupied={isCellOccupied(qIndex, cIndex)}
                />
              </div>
            ))
          )}
        </div>
        
        {gates.map((gate) => {
          const gateBaseLeft = 48 + gate.column * CELL_WIDTH; 
          const gatePaletteInfo = ALL_PALETTE_GATES_MAP.get(gate.type);
          let gateRenderElements: React.ReactNode[] = [];

          if (!gatePaletteInfo) return null; // Should not happen

          const title = `Gate: ${gate.type}, Qubits: ${gate.qubits.join(',')}, Col: ${gate.column}. Click to remove.`;

          if (gatePaletteInfo.numQubits === 1 || (gatePaletteInfo.numQubits !== 'all' && gatePaletteInfo.numQubits > 1 && (gate.type !== "CNOT" && gate.type !== "CY" && gate.type !== "CZ" && gate.type !== "CPHASE" && gate.type !== "CRX" && gate.type !== "CRY" && gate.type !== "CRZ" && gate.type !== "SWAP" && gate.type !== "TOFFOLI" && gate.type !== "FREDKIN" && gate.type !== "CCZ"))) {
            // Default rendering for single-qubit gates or multi-qubit gates not specially handled below
            gateRenderElements.push(
              <div
                key={`${gate.id}-main`}
                className="absolute z-10"
                style={{ 
                  top: `${gate.qubits[0] * CELL_HEIGHT + (CELL_HEIGHT - 40) / 2}px`,
                  left: `${gateBaseLeft + (CELL_WIDTH - 40) / 2}px`
                }}
              >
                {createDeletableGateIcon(gate.id, onRemoveGate, { type: gate.type, title }, "main")}
              </div>
            );
             // Add markers and connecting line for generic multi-qubit gates (if not specially handled)
            if (typeof gatePaletteInfo.numQubits === 'number' && gatePaletteInfo.numQubits > 1) {
                const sortedQubits = [...gate.qubits].sort((a,b)=>a-b);
                const minQubit = sortedQubits[0];
                const maxQubit = sortedQubits[sortedQubits.length-1];
                 gateRenderElements.push(
                    <div
                        key={`${gate.id}-line-generic`}
                        className="absolute bg-accent z-0"
                        style={{
                        top: `${minQubit * CELL_HEIGHT + CELL_HEIGHT / 2 - 1}px`,
                        left: `${gateBaseLeft + CELL_WIDTH / 2 - 1}px`,
                        width: '2px',
                        height: `${(maxQubit - minQubit) * CELL_HEIGHT + 2}px`,
                        }}
                    />
                );
                for (let i = 1; i < sortedQubits.length; i++) {
                     gateRenderElements.push(
                        <div key={`${gate.id}-marker-${sortedQubits[i]}`} className="absolute z-10" style={{ top: `${sortedQubits[i] * CELL_HEIGHT + CELL_HEIGHT/2 - 4}px`, left: `${gateBaseLeft + CELL_WIDTH/2 - 4}px`}}>
                             {createDeletableGateIcon(gate.id, onRemoveGate, { type: gate.type, title: `Part of ${gate.type} (click to remove)`, className:"w-2 h-2 bg-accent rounded-full !border-0" }, `marker-${sortedQubits[i]}`)}
                        </div>
                    );
                }
            }

          } else { // Special handling for multi-qubit gates
            const sortedQubits = [...gate.qubits].sort((a, b) => a - b);
            const minQubit = sortedQubits[0];
            const maxQubit = sortedQubits[sortedQubits.length - 1];

            gateRenderElements.push(
              <div
                key={`${gate.id}-line`}
                className="absolute bg-accent z-0"
                style={{
                  top: `${minQubit * CELL_HEIGHT + CELL_HEIGHT / 2 - 1}px`,
                  left: `${gateBaseLeft + CELL_WIDTH / 2 - 1}px`,
                  width: '2px',
                  height: `${(maxQubit - minQubit) * CELL_HEIGHT + 2}px`,
                }}
              />
            );
            
            if (gate.type === "CNOT" || gate.type === "CY" || gate.type === "CZ" || gate.type === "CPHASE" || gate.type === "CRX" || gate.type === "CRY" || gate.type === "CRZ") {
                const controlQubit = sortedQubits[0];
                const targetQubit = sortedQubits[1];
                gateRenderElements.push(
                  <div key={`${gate.id}-control`} className="absolute z-10" style={{ top: `${controlQubit * CELL_HEIGHT + (CELL_HEIGHT - 16)/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - 16)/2}px`}}>
                    {createDeletableGateIcon(gate.id, onRemoveGate, {type: "CNOT", isControl: true, title}, "control")}
                  </div>,
                  <div key={`${gate.id}-target`} className="absolute z-10" style={{ top: `${targetQubit * CELL_HEIGHT + (CELL_HEIGHT - (gate.type === "CNOT" ? 32 : 40))/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - (gate.type === "CNOT" ? 32 : 40))/2}px`}}>
                    {createDeletableGateIcon(gate.id, onRemoveGate, {type: gate.type === "CNOT" ? "CNOT" : gate.type, isTarget: gate.type === "CNOT", isTargetSymbol: gate.type !== "CNOT", title}, "target")}
                  </div>
                );
            } else if (gate.type === "SWAP") {
                 gateRenderElements.push(
                    <div key={`${gate.id}-swap1`} className="absolute z-10" style={{ top: `${sortedQubits[0] * CELL_HEIGHT + (CELL_HEIGHT - 24)/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - 24)/2}px`}}>
                        {createDeletableGateIcon(gate.id, onRemoveGate, {type: "X", isTargetSymbol: true, className:"text-accent text-2xl", title}, "swap1")}
                    </div>,
                    <div key={`${gate.id}-swap2`} className="absolute z-10" style={{ top: `${sortedQubits[1] * CELL_HEIGHT + (CELL_HEIGHT - 24)/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - 24)/2}px`}}>
                        {createDeletableGateIcon(gate.id, onRemoveGate, {type: "X", isTargetSymbol: true, className:"text-accent text-2xl", title}, "swap2")}
                    </div>
                 );
            } else if (gate.type === "TOFFOLI" || gate.type === "FREDKIN" || gate.type === "CCZ" ) {
                const control1 = sortedQubits[0];
                const control2 = sortedQubits[1];
                const target = sortedQubits[2];
                gateRenderElements.push(
                     <div key={`${gate.id}-ctrl1`} className="absolute z-10" style={{ top: `${control1 * CELL_HEIGHT + (CELL_HEIGHT - 16)/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - 16)/2}px`}}>
                        {createDeletableGateIcon(gate.id, onRemoveGate, {type: "CNOT", isControl: true, title}, "ctrl1")}
                    </div>,
                    <div key={`${gate.id}-ctrl2`} className="absolute z-10" style={{ top: `${control2 * CELL_HEIGHT + (CELL_HEIGHT - 16)/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - 16)/2}px`}}>
                        {createDeletableGateIcon(gate.id, onRemoveGate, {type: "CNOT", isControl: true, title}, "ctrl2")}
                    </div>,
                    <div key={`${gate.id}-target3`} className="absolute z-10" style={{ top: `${target * CELL_HEIGHT + (CELL_HEIGHT - (gate.type === "TOFFOLI" ? 32 : 40))/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - (gate.type === "TOFFOLI" ? 32 : 40))/2}px`}}>
                       {createDeletableGateIcon(gate.id, onRemoveGate, {type: gate.type === "TOFFOLI" ? "CNOT" : gate.type, isTarget: gate.type === "TOFFOLI", isTargetSymbol: gate.type !== "TOFFOLI", title}, "target3")}
                    </div>
                );

            } else if (gate.type === "MEASURE_ALL") {
                 gateRenderElements = gate.qubits.map(q => (
                    <div
                        key={`${gate.id}-measure-${q}`}
                        className="absolute z-10"
                        style={{ 
                        top: `${q * CELL_HEIGHT + (CELL_HEIGHT - 40) / 2}px`,
                        left: `${gateBaseLeft + (CELL_WIDTH - 40) / 2}px`
                        }}
                    >
                        {createDeletableGateIcon(gate.id, onRemoveGate, {type: "MEASURE", title: `Remove Measure All on Q${q}`}, `measure-${q}`)}
                    </div>
                 ));
            }
          }

          return <React.Fragment key={gate.id}>{gateRenderElements}</React.Fragment>;
        })}
      </div>
    </div>
  );
}

