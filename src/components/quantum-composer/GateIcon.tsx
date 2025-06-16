
"use client";

import type { GateSymbol } from "@/lib/circuit-types";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

interface GateIconProps {
  type: GateSymbol;
  isPaletteItem?: boolean;
  isControl?: boolean; // For CNOT control part
  isTarget?: boolean; // For CNOT target part
  onClick?: () => void;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  title?: string;
}

export function GateIcon({
  type,
  isPaletteItem = false,
  isControl = false,
  isTarget = false,
  onClick,
  className,
  draggable,
  onDragStart,
  title,
}: GateIconProps) {
  const baseClasses =
    "flex items-center justify-center font-medium border-2 rounded-md transition-all duration-150 ease-in-out select-none";
  const sizeClasses = isPaletteItem ? "w-12 h-12 text-lg" : "w-10 h-10 text-base";
  const paletteItemClasses = isPaletteItem
    ? "bg-secondary hover:bg-accent hover:text-accent-foreground border-border cursor-grab shadow-md"
    : "border-primary bg-primary/20 text-primary-foreground shadow-sm";
  
  const specificGateClasses = () => {
    switch (type) {
      case "H": return "border-blue-400 text-blue-300";
      case "X": return "border-red-400 text-red-300";
      case "Y": return "border-green-400 text-green-300";
      case "Z": return "border-yellow-400 text-yellow-300";
      case "CNOT": 
        if (isControl) return "bg-accent text-accent-foreground border-accent !w-4 !h-4 rounded-full"; // Control dot smaller
        if (isTarget) return "border-accent text-accent-foreground !w-8 !h-8"; // Target XOR slightly smaller
        return "border-purple-400 text-purple-300"; // General CNOT representation in palette
      case "MEASURE": return "border-gray-400 text-gray-300";
      default: return "border-foreground";
    }
  };

  const gateDisplay = () => {
    if (isControl) return "●";
    if (isTarget && type === "CNOT") return "⊕";
    if (type === "MEASURE") return <Activity size={isPaletteItem ? 24 : 20} />;
    return type;
  };

  return (
    <div
      className={cn(
        baseClasses,
        sizeClasses,
        isPaletteItem ? paletteItemClasses : specificGateClasses(),
        className
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      title={title || type}
      role={draggable ? "button" : undefined}
      aria-label={title || `Quantum gate ${type}`}
    >
      {gateDisplay()}
    </div>
  );
}
