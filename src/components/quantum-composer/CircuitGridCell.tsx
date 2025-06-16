
"use client";

import { cn } from "@/lib/utils";
import React, { useState } from 'react';
import type { PaletteGateInfo } from "@/lib/circuit-types";

interface CircuitGridCellProps {
  qubit: number;
  column: number;
  onDrop: (qubit: number, column: number, gateInfoJSON: string) => void;
  isOccupied: boolean;
  children?: React.ReactNode;
}

export function CircuitGridCell({ qubit, column, onDrop, isOccupied, children }: CircuitGridCellProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Allow drop if not occupied OR if it's a multi-qubit gate part being placed (more complex logic for this not added here yet)
    // For simplicity now, allow drag over if not strictly occupied by a full gate.
    // The canvas's pending gate logic will handle more precise placement rules.
    setIsDragOver(true); 
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Defer occupation check to canvas, as this cell might be a valid
    // *second* or *third* qubit for a multi-qubit gate.
    // if (isOccupied) return; 

    const gateInfoJSON = e.dataTransfer.getData("gateInfo");
    
    if (gateInfoJSON) {
      onDrop(qubit, column, gateInfoJSON);
    }
  };

  return (
    <div
      className={cn(
        "relative w-16 h-16 border border-dashed border-muted-foreground/30 flex items-center justify-center transition-colors",
        isDragOver && "bg-accent/30", // Show drag over even if occupied, canvas logic will decide
        isOccupied && "border-transparent" 
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

