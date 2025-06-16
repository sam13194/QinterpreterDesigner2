"use client";

import { cn } from "@/lib/utils";
import React, { useState } from 'react';

interface CircuitGridCellProps {
  qubit: number;
  column: number;
  onDrop: (qubit: number, column: number, gateType: string, controlQubit?: number) => void;
  isOccupied: boolean;
  children?: React.ReactNode;
}

export function CircuitGridCell({ qubit, column, onDrop, isOccupied, children }: CircuitGridCellProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isOccupied) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isOccupied) return;

    const gateType = e.dataTransfer.getData("gateType");
    const controlQubitStr = e.dataTransfer.getData("controlQubit"); // For CNOT control qubit selection
    
    if (gateType) {
      if (gateType === "CNOT") {
        const isPlacingControl = e.dataTransfer.getData("isPlacingControl") === "true";
        if (isPlacingControl) {
           // This cell is now the control qubit
           e.dataTransfer.setData("controlQubit", qubit.toString());
           // TODO: Need a visual cue or state to show control is set and waiting for target
           // For simplicity in MVP, we might need a different CNOT drop mechanism
           // Or, assume CNOT drag always defines target, and user clicks control later or vice-versa
           // For now, let's assume CNOT drop on a cell means this is the TARGET qubit
           // and we'll need a separate mechanism or modal to pick control.
           // A simpler approach for MVP: when CNOT is dropped, it needs *two* qubits.
           // Maybe the drag data should contain info like "CNOT_TARGET" or "CNOT_CONTROL"
           // Or, drop CNOT onto a qubit, then click another qubit to set it as control/target.
           // For this implementation, let's assume simple CNOT drop sets the target, and control is TBD or via props.
           // This means the `onDrop` handler in `CircuitCanvas` needs to be smarter for CNOT.
           // For the purpose of this cell, it just relays the drop.
           onDrop(qubit, column, gateType);
        } else {
            // This cell is the target qubit, check if controlQubit is already set in drag data
            const controlQubit = controlQubitStr ? parseInt(controlQubitStr, 10) : undefined;
             if (controlQubit !== undefined && controlQubit !== qubit) { // Ensure control and target are different
                onDrop(qubit, column, gateType, controlQubit);
             } else {
                // If control qubit not set or same as target, maybe prompt user or handle error
                // For now, let's allow dropping CNOT and then clicking for control
                onDrop(qubit, column, gateType); // Let canvas handle logic for incomplete CNOT
             }
        }

      } else { // Single qubit gate
        onDrop(qubit, column, gateType);
      }
    }
  };

  return (
    <div
      className={cn(
        "relative w-16 h-16 border border-dashed border-muted-foreground/30 flex items-center justify-center transition-colors",
        isDragOver && !isOccupied && "bg-accent/30",
        isOccupied && "border-transparent" // Don't show cell border if occupied by gate
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-qubit={qubit}
      data-column={column}
    >
      {children}
    </div>
  );
}
