
"use client";

import type { GateSymbol } from "@/lib/circuit-types";
import { cn } from "@/lib/utils";
import { Activity, ListChecks, Eraser } from "lucide-react"; // Added ListChecks, Eraser

interface GateIconProps {
  type: GateSymbol;
  displayText?: string; // For palette display e.g. "RX(θ)"
  isPaletteItem?: boolean;
  isControl?: boolean; // For CNOT control part
  isTarget?: boolean; // For CNOT target part
  onClick?: () => void;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  title?: string; // For canvas items (dynamic title)
  paletteTooltip?: string; // For palette items (static tooltip)
}

export function GateIcon({
  type,
  displayText,
  isPaletteItem = false,
  isControl = false,
  isTarget = false,
  onClick,
  className,
  draggable,
  onDragStart,
  title,
  paletteTooltip,
}: GateIconProps) {
  const baseClasses =
    "flex items-center justify-center font-medium border-2 rounded-md transition-all duration-150 ease-in-out select-none text-xs sm:text-sm"; // Adjusted text size
  
  const sizeClasses = isPaletteItem 
    ? "w-full h-10 min-w-[3rem] px-1 py-1" // Ensure full width in grid cell, responsive height
    : "w-10 h-10"; // Canvas gate size

  const paletteItemClasses = isPaletteItem
    ? "bg-secondary hover:bg-accent hover:text-accent-foreground border-border cursor-grab shadow-md"
    : "border-primary bg-primary/20 text-primary-foreground shadow-sm";
  
  // Define default classes for new gates, can be overridden by specific type
  const defaultNewGateClasses = "border-muted-foreground text-muted-foreground";

  const specificGateClasses = () => {
    switch (type) {
      case "H": return "border-blue-400 text-blue-300";
      case "X": return "border-red-400 text-red-300";
      case "Y": return "border-green-400 text-green-300";
      case "Z": return "border-yellow-400 text-yellow-300";
      case "CNOT": 
        if (isControl) return "bg-accent text-accent-foreground border-accent !w-4 !h-4 rounded-full";
        if (isTarget) return "border-accent text-accent-foreground !w-8 !h-8";
        return "border-purple-400 text-purple-300"; // General CNOT representation in palette
      case "MEASURE": return "border-gray-400 text-gray-300";
      case "S": case "T": case "I":
      case "RX": case "RY": case "RZ":
      case "SDG": case "TDG": case "PHASE":
      case "U1": case "U2": case "U3":
      case "CY": case "CZ": case "SWAP": case "ISWAP":
      case "CPHASE": case "CRX": case "CRY": case "CRZ":
      case "TOFFOLI": case "FREDKIN": case "CCZ":
      case "MEASURE_ALL": case "RESET":
        return defaultNewGateClasses; // Use default for new gates, palette text will differentiate
      default: return "border-foreground";
    }
  };

  const gateDisplayContent = () => {
    const iconSize = isPaletteItem ? 18 : 20; // Slightly smaller icons for palette if needed

    if (isPaletteItem && displayText) return displayText; // Show "RX(θ)" etc. in palette

    // Canvas display logic
    if (isControl) return "●";
    if (isTarget && type === "CNOT") return "⊕";
    
    switch (type) {
      case "MEASURE": return <Activity size={iconSize} />;
      case "RESET": return <Eraser size={iconSize} />;
      case "MEASURE_ALL": return <ListChecks size={iconSize} />;
      case "SDG": return "S†";
      case "TDG": return "T†";
      case "PHASE": return "P";
      case "TOFFOLI": return "CCX";
      case "FREDKIN": return "CSWAP";
      // For other simple gates (H, X, RX, U1, S, T, CY, CZ, SWAP etc.),
      // their 'type' string (e.g., "H", "X", "RX") will be returned by default.
      default: return type;
    }
  };

  return (
    <div
      className={cn(
        baseClasses,
        sizeClasses,
        isPaletteItem ? paletteItemClasses : specificGateClasses(),
        // Apply specific gate class if not a palette item, or if it's a CNOT control/target
        (!isPaletteItem || (type === "CNOT" && (isControl || isTarget))) && specificGateClasses(),
        className
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      title={isPaletteItem ? paletteTooltip : (title || type)} // Use paletteTooltip for palette, dynamic title or type for canvas
      role={draggable ? "button" : undefined}
      aria-label={isPaletteItem ? paletteTooltip : (title || `Quantum gate ${type}`)}
    >
      {gateDisplayContent()}
    </div>
  );
}
