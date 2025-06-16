
"use client";

import type { Gate, GateSymbol, VisualCircuit, PaletteGateInfo } from "@/lib/circuit-types";
import { GATE_INFO_MAP } from "@/lib/circuit-types";
import { CircuitGridCell } from "./CircuitGridCell";
import { GateIcon } from "./GateIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MinusCircle, Trash2, GitCommitHorizontal } from "lucide-react";
import React, { useState, useCallback, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface CircuitCanvasProps {
  circuit: VisualCircuit & { numColumns: number };
  circuitName: string;
  onCircuitNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  numQubits: number;
  onNumQubitsChange: (value: number | string) => void;
  numShots: number;
  onNumShotsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddQubit: () => void;
  onRemoveQubit: () => void;
  onAddGate: (type: GateSymbol, qubits: number[], column: number) => void;
  onRemoveGate: (gateId: string) => void;
  onAddColumn: () => void;
  onSelectGate: (gateId: string | null) => void;
}

const CELL_WIDTH = 64;
const CELL_HEIGHT = 64;

interface PendingMultiQubitGate {
  gateInfo: PaletteGateInfo;
  column: number;
  collectedQubits: number[];
}

const createDeletableGateIconWrapper = (
    gateId: string,
    onRemoveGate: (id: string) => void,
    onSelectGate: (id: string | null) => void,
    children: React.ReactNode,
    title: string,
    isBarrierLine?: boolean
) => (
    <div
      className={cn("relative group cursor-pointer", isBarrierLine ? "w-full h-full" : "")}
      onClick={(e) => {
        e.stopPropagation();
        onSelectGate(gateId);
      }}
      title={title}
    >
        {children}
        <Button
            variant="ghost" size="icon"
            className={cn(
              "absolute w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full z-20",
              isBarrierLine ? "-top-3 left-1/2 -translate-x-1/2" : "-top-3 -right-3"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelectGate(null); 
              onRemoveGate(gateId);
            }}
            aria-label={`Remove gate`}
        >
            <Trash2 size={12} />
        </Button>
    </div>
);


export function CircuitCanvas({
  circuit,
  circuitName,
  onCircuitNameChange,
  numQubits: currentNumQubits, 
  onNumQubitsChange,
  numShots,
  onNumShotsChange,
  onAddQubit,
  onRemoveQubit,
  onAddGate,
  onRemoveGate,
  onAddColumn,
  onSelectGate,
}: CircuitCanvasProps) {
  const { gates, numColumns } = circuit;
  const [pendingMultiQubitGate, setPendingMultiQubitGate] = useState<PendingMultiQubitGate | null>(null);

  const handleDrop = (targetQubit: number, column: number, gateInfoJSON: string) => {
    try {
      const gateInfo = JSON.parse(gateInfoJSON) as PaletteGateInfo;
      if (!gateInfo || !gateInfo.type || typeof gateInfo.numQubits === 'undefined') {
        console.error("Invalid gateInfo received on drop:", gateInfoJSON);
        return;
      }
      
      setPendingMultiQubitGate(null);
      onSelectGate(null); 

      if (gateInfo.type === "BARRIER" || gateInfo.type === "MEASURE_ALL") {
        const allQubits = Array.from({ length: currentNumQubits }, (_, i) => i);
        onAddGate(gateInfo.type, allQubits, column);
      } else if (gateInfo.numQubits === 1) {
        onAddGate(gateInfo.type, [targetQubit], column);
      } else if (typeof gateInfo.numQubits === 'number' && gateInfo.numQubits > 1) {
        setPendingMultiQubitGate({ gateInfo, column, collectedQubits: [targetQubit] });
      }
    } catch (error) {
        console.error("Error processing dropped gate info:", error);
    }
  };
  
  const handleCellClick = (q: number, c: number) => {
    onSelectGate(null); 
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
        onSelectGate(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onSelectGate]);

  const getGateAt = (qubit: number, column: number): Gate | undefined => {
    return gates.find(g => g.column === column && g.qubits.includes(qubit) && g.type !== "BARRIER");
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
      <div className="flex flex-wrap items-center mb-4 gap-x-4 gap-y-2 w-full">
        <div className="flex items-center gap-2">
            <Button onClick={onAddQubit} variant="outline" size="sm" aria-label="Add Qubit">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Qubit
            </Button>
            <Button onClick={onRemoveQubit} variant="outline" size="sm" disabled={currentNumQubits <=1} aria-label="Remove Qubit">
            <MinusCircle className="mr-2 h-4 w-4" /> Remove Qubit
            </Button>
            <Button onClick={onAddColumn} variant="outline" size="sm" aria-label="Add Time Step">
            <GitCommitHorizontal className="mr-2 h-4 w-4 transform rotate-90" /> Add Step
            </Button>
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="circuitNameCanvas" className="text-sm shrink-0">Name:</Label>
            <Input
                id="circuitNameCanvas"
                value={circuitName}
                onChange={onCircuitNameChange}
                placeholder="My Quantum Circuit"
                className="h-9 text-sm w-40"
            />
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="numQubitsCanvas" className="text-sm shrink-0">Qubits:</Label>
            <Input
                id="numQubitsCanvas"
                type="number"
                value={currentNumQubits}
                onChange={(e) => onNumQubitsChange(e.target.value === "" ? currentNumQubits : parseInt(e.target.value, 10))}
                min="1"
                max="16" 
                className="h-9 text-sm w-20"
            />
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="numShotsCanvas" className="text-sm shrink-0">Shots:</Label>
            <Input
                id="numShotsCanvas"
                type="number"
                value={numShots}
                onChange={onNumShotsChange}
                min="1"
                step="100"
                className="h-9 text-sm w-24"
            />
        </div>
        {getPendingFeedbackMessage() && (
          <div className="mt-2 md:mt-0 md:ml-4 p-2 bg-accent/20 text-accent-foreground rounded-md text-sm w-full md:w-auto">
            {getPendingFeedbackMessage()}
          </div>
        )}
      </div>

      <div className="relative" style={{ minWidth: `${numColumns * CELL_WIDTH + 60}px` }}>
        {Array.from({ length: currentNumQubits }).map((_, qIndex) => (
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
          {Array.from({ length: currentNumQubits }).map((_, qIndex) =>
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
        
        {gates.filter(gate => gate.type === "BARRIER").map(gate => {
          const gateBaseLeft = 48 + gate.column * CELL_WIDTH;
          const title = `Barrier at column ${gate.column}. Click to select/edit.`;
          return (
            <div
              key={gate.id}
              className="absolute z-5" 
              style={{
                top: `${CELL_HEIGHT / 4}px`, 
                left: `${gateBaseLeft + CELL_WIDTH / 2 - 1}px`, 
                width: '2px',
                height: `${(currentNumQubits - 0.5) * CELL_HEIGHT}px`, 
              }}
            >
              {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate, 
                <div className="w-full h-full bg-border border-dashed border-primary" />,
                title,
                true 
              )}
            </div>
          );
        })}

        {gates.filter(gate => gate.type !== "BARRIER").map((gate) => {
          const gateBaseLeft = 48 + gate.column * CELL_WIDTH;
          const gatePaletteInfo = GATE_INFO_MAP.get(gate.type);
          let gateRenderElements: React.ReactNode[] = [];

          if (!gatePaletteInfo) return null;

          const title = `Gate: ${gatePaletteInfo.displayName}, Qubits: ${gate.qubits.join(',')}, Col: ${gate.column}. Click to select/edit.`;

          if (gatePaletteInfo.numQubits === 1 || (gatePaletteInfo.numQubits !== 'all' && gatePaletteInfo.numQubits > 1 && (gate.type !== "CNOT" && gate.type !== "CY" && gate.type !== "CZ" && gate.type !== "CPHASE" && gate.type !== "CRX" && gate.type !== "CRY" && gate.type !== "CRZ" && gate.type !== "SWAP" && gate.type !== "TOFFOLI" && gate.type !== "FREDKIN" && gate.type !== "CCZ"))) {
            const gateTop = gate.qubits[0] * CELL_HEIGHT + (CELL_HEIGHT - 40) / 2;
            const gateLeft = gateBaseLeft + (CELL_WIDTH - 40) / 2;
            
            const mainIconElement = createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate,
                <GateIcon type={gate.type} params={gate.params} />,
                title
            );
            gateRenderElements.push(
                React.cloneElement(mainIconElement, { key: `${gate.id}-icon-${gate.qubits[0]}` })
            );
            
            if (typeof gatePaletteInfo.numQubits === 'number' && gatePaletteInfo.numQubits > 1) {
                const sortedQubits = [...gate.qubits].sort((a,b)=>a-b);
                const minQubit = sortedQubits[0];
                const maxQubit = sortedQubits[sortedQubits.length-1];
                 gateRenderElements.push(
                    <div
                        key={`${gate.id}-line-generic`}
                        className="absolute bg-accent z-0 pointer-events-none" 
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
                           {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate,
                             <div className="w-2 h-2 bg-accent rounded-full !border-0" />,
                             `Part of ${gatePaletteInfo.displayName} (click to select/edit)`
                           )}
                        </div>
                    );
                }
            }
             return (
                <div key={gate.id} className="absolute z-10" style={{top: `${gateTop}px`, left: `${gateLeft}px`}}>
                    {gateRenderElements}
                </div>
             );


          } else { 
            const sortedQubits = [...gate.qubits].sort((a, b) => a - b);
            const minQubit = sortedQubits[0];
            const maxQubit = sortedQubits[sortedQubits.length - 1];

            gateRenderElements.push(
              <div
                key={`${gate.id}-line`}
                className="absolute bg-accent z-0 pointer-events-none" 
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
                    {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate, <GateIcon type="CNOT" isControl={true} params={gate.params} />, title)}
                  </div>,
                  <div key={`${gate.id}-target`} className="absolute z-10" style={{ top: `${targetQubit * CELL_HEIGHT + (CELL_HEIGHT - (gate.type === "CNOT" ? 32 : 40))/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - (gate.type === "CNOT" ? 32 : 40))/2}px`}}>
                    {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate, <GateIcon type={gate.type} isTarget={gate.type === "CNOT"} isTargetSymbol={gate.type !== "CNOT"} params={gate.params} />, title)}
                  </div>
                );
            } else if (gate.type === "SWAP") {
                 gateRenderElements.push(
                    <div key={`${gate.id}-swap1`} className="absolute z-10" style={{ top: `${sortedQubits[0] * CELL_HEIGHT + (CELL_HEIGHT - 24)/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - 24)/2}px`}}>
                        {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate, <GateIcon type="X" isTargetSymbol={true} className="text-accent text-2xl" params={gate.params} />, title)}
                    </div>,
                    <div key={`${gate.id}-swap2`} className="absolute z-10" style={{ top: `${sortedQubits[1] * CELL_HEIGHT + (CELL_HEIGHT - 24)/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - 24)/2}px`}}>
                        {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate, <GateIcon type="X" isTargetSymbol={true} className="text-accent text-2xl" params={gate.params} />, title)}
                    </div>
                 );
            } else if (gate.type === "TOFFOLI" || gate.type === "FREDKIN" || gate.type === "CCZ" ) { 
                const control1 = sortedQubits[0];
                const control2 = sortedQubits[1];
                const target = sortedQubits[2];
                gateRenderElements.push(
                     <div key={`${gate.id}-ctrl1`} className="absolute z-10" style={{ top: `${control1 * CELL_HEIGHT + (CELL_HEIGHT - 16)/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - 16)/2}px`}}>
                        {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate, <GateIcon type="CNOT" isControl={true} params={gate.params} />, title)}
                    </div>,
                    <div key={`${gate.id}-ctrl2`} className="absolute z-10" style={{ top: `${control2 * CELL_HEIGHT + (CELL_HEIGHT - 16)/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - 16)/2}px`}}>
                        {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate, <GateIcon type="CNOT" isControl={true} params={gate.params} />, title)}
                    </div>,
                    <div key={`${gate.id}-target3`} className="absolute z-10" style={{ top: `${target * CELL_HEIGHT + (CELL_HEIGHT - (gate.type === "TOFFOLI" || gate.type === "FREDKIN" ? 32 : 40))/2}px`, left: `${gateBaseLeft + (CELL_WIDTH - (gate.type === "TOFFOLI" || gate.type === "FREDKIN" ? 32 : 40))/2}px`}}>
                       {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate, <GateIcon type={gate.type} isTarget={(gate.type === "TOFFOLI" || gate.type === "FREDKIN")} isTargetSymbol={gate.type !== "TOFFOLI" && gate.type !== "FREDKIN"} params={gate.params}/>, title)}
                    </div>
                );

            } else if (gate.type === "MEASURE_ALL") {
                 const measureAllElements = gate.qubits.map(q => (
                    <div
                        key={`${gate.id}-measure-${q}`}
                        className="absolute z-10"
                        style={{
                        top: `${q * CELL_HEIGHT + (CELL_HEIGHT - 40) / 2}px`,
                        left: `${gateBaseLeft + (CELL_WIDTH - 40) / 2}px`
                        }}
                    >
                        {createDeletableGateIconWrapper(gate.id, onRemoveGate, onSelectGate, <GateIcon type="MEASURE" params={gate.params} />, `Measure on Q${q} (part of Measure All)`)}
                    </div>
                 ));
                 return <React.Fragment key={gate.id}>{measureAllElements}</React.Fragment>;
            }
          }
          // Default case if no specific rendering logic is hit, ensuring a keyed fragment.
          // This path should ideally not be taken if all gate types are handled above.
          if (gateRenderElements.length > 0) {
            return <React.Fragment key={gate.id}>{gateRenderElements}</React.Fragment>;
          }
          return null; // Or some placeholder if a gate type isn't fully rendered.
        })}
      </div>
    </div>
  );
}

