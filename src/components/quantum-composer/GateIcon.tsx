
"use client";

import type { GateSymbol } from "@/lib/circuit-types";
import { cn } from "@/lib/utils";
import { Activity, ListChecks, Eraser } from "lucide-react"; 

interface GateIconProps {
  type: GateSymbol;
  displayText?: string; 
  isPaletteItem?: boolean;
  isControl?: boolean; 
  isTarget?: boolean; 
  isTargetSymbol?: boolean; // New: To render just the symbol for targets of non-CNOT controlled gates
  onClick?: () => void;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  title?: string; 
  paletteTooltip?: string; 
}

export function GateIcon({
  type,
  displayText,
  isPaletteItem = false,
  isControl = false,
  isTarget = false,
  isTargetSymbol = false,
  onClick,
  className,
  draggable,
  onDragStart,
  title,
  paletteTooltip,
}: GateIconProps) {
  const baseClasses =
    "flex items-center justify-center font-medium border-2 rounded-md transition-all duration-150 ease-in-out select-none text-xs sm:text-sm";
  
  const sizeClasses = isPaletteItem 
    ? "w-full h-10 min-w-[3rem] px-1 py-1" 
    : isTargetSymbol ? "w-auto h-auto p-1 border-0 bg-transparent" // Simpler style for target symbols
    : "w-10 h-10"; 

  const paletteItemClasses = isPaletteItem
    ? "bg-secondary hover:bg-accent hover:text-accent-foreground border-border cursor-grab shadow-md"
    : isTargetSymbol ? "text-primary-foreground shadow-none" // No border/bg for simple target symbols
    : "border-primary bg-primary/20 text-primary-foreground shadow-sm";
  
  const defaultNewGateClasses = "border-muted-foreground text-muted-foreground";

  const specificGateClasses = () => {
    if (isTargetSymbol) { // Target symbols (like Y in CY) shouldn't have their own specific borders usually.
        switch(type){ // Unless it's a special symbol like CNOT target
            case "CNOT": if(isTarget) return "border-accent text-accent-foreground !w-8 !h-8"; break;
            default: return "border-transparent"; // No border for simple text like 'Y', 'Z'
        }
    }
    switch (type) {
      case "H": return "border-blue-400 text-blue-300";
      case "X": return "border-red-400 text-red-300";
      case "Y": return "border-green-400 text-green-300";
      case "Z": return "border-yellow-400 text-yellow-300";
      case "CNOT": 
        if (isControl) return "bg-accent text-accent-foreground border-accent !w-4 !h-4 rounded-full";
        if (isTarget) return "border-accent text-accent-foreground !w-8 !h-8"; // CNOT target XOR
        return "border-purple-400 text-purple-300"; // CNOT in palette
      case "MEASURE": return "border-gray-400 text-gray-300";
      case "S": case "T": case "I":
      case "RX": case "RY": case "RZ":
      case "SDG": case "TDG": case "PHASE":
      case "U1": case "U2": case "U3":
      case "CY": case "CZ": case "SWAP": case "ISWAP":
      case "CPHASE": case "CRX": case "CRY": case "CRZ":
      case "TOFFOLI": case "FREDKIN": case "CCZ":
      case "MEASURE_ALL": case "RESET":
        return defaultNewGateClasses; 
      default: return "border-foreground";
    }
  };

  const gateDisplayContent = () => {
    const iconSize = isPaletteItem ? 18 : 20;

    if (isPaletteItem && displayText) return displayText; 

    if (isControl) return "●"; // Control dot for any controlled gate
    if (isTarget && type === "CNOT") return "⊕"; // Specific CNOT target
    if (isTargetSymbol) { // For CY, CZ, etc. targets, just show the letter
        if (type === "CY") return "Y";
        if (type === "CZ") return "Z";
        if (type === "CPHASE") return "P"; // Or R_phi, symbol may vary
        if (type === "CRX") return "RX";
        if (type === "CRY") return "RY";
        if (type === "CRZ") return "RZ";
        if (type === "TOFFOLI") return "⊕"; // Same as CNOT target for CCX
        if (type === "FREDKIN") return "✕"; // Swap symbol for CSWAP target
        if (type === "CCZ") return "Z"; // Z on target for CCZ
        return type; // Fallback
    }
    
    switch (type) {
      case "MEASURE": return <Activity size={iconSize} />;
      case "RESET": return <Eraser size={iconSize} />;
      case "MEASURE_ALL": return <ListChecks size={iconSize} />;
      case "SDG": return "S†";
      case "TDG": return "T†";
      case "PHASE": return "P";
      case "TOFFOLI": return "CCX"; // Palette display
      case "FREDKIN": return "CSWAP"; // Palette display
      case "CY": return "CY"; // Palette/default display
      case "CZ": return "CZ";
      case "CPHASE": return "CP";
      case "CRX": return "CRX";
      case "CRY": return "CRY";
      case "CRZ": return "CRZ";
      case "SWAP": return "SWAP"; // In palette, canvas uses 'X' markers
      default: return type;
    }
  };

  return (
    <div
      className={cn(
        baseClasses,
        sizeClasses,
        isPaletteItem ? paletteItemClasses : specificGateClasses(),
        (!isPaletteItem || (type === "CNOT" && (isControl || isTarget)) || isTargetSymbol ) && specificGateClasses(),
        className
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      title={isPaletteItem ? paletteTooltip : (title || type)}
      role={draggable ? "button" : undefined}
      aria-label={isPaletteItem ? paletteTooltip : (title || `Quantum gate ${type}`)}
    >
      {gateDisplayContent()}
    </div>
  );
}

