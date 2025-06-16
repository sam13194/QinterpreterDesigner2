
"use client";

import type { GateSymbol } from "@/lib/circuit-types";
import { GATE_INFO_MAP } from "@/lib/circuit-types";
import { cn } from "@/lib/utils";
import { Activity, ListChecks, Eraser } from "lucide-react"; 

interface GateIconProps {
  type: GateSymbol;
  params?: { [key: string]: number | string };
  displayText?: string; 
  isPaletteItem?: boolean;
  isControl?: boolean; 
  isTarget?: boolean; 
  isTargetSymbol?: boolean; 
  onClick?: () => void;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  title?: string; 
  paletteTooltip?: string; 
}

export function GateIcon({
  type,
  params,
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
    : isTargetSymbol ? "w-auto h-auto p-1 border-0 bg-transparent"
    : "w-10 h-10"; 

  const paletteItemClasses = isPaletteItem
    ? "bg-secondary hover:bg-accent hover:text-accent-foreground border-border cursor-grab shadow-md"
    : isTargetSymbol ? "text-primary-foreground shadow-none" 
    : "border-primary bg-primary/20 text-primary-foreground shadow-sm";
  
  const defaultNewGateClasses = "border-muted-foreground text-muted-foreground";

  const specificGateClasses = () => {
    if (isTargetSymbol) { 
        switch(type){ 
            case "CNOT": if(isTarget) return "border-accent text-accent-foreground !w-8 !h-8"; break;
            default: return "border-transparent"; 
        }
    }
    switch (type) {
      case "H": return "border-blue-400 text-blue-300";
      case "X": return "border-red-400 text-red-300";
      case "Y": return "border-green-400 text-green-300";
      case "Z": return "border-yellow-400 text-yellow-300";
      case "CNOT": 
        if (isControl) return "bg-accent text-accent-foreground border-accent !w-4 !h-4 rounded-full";
        if (isTarget) return "border-accent text-accent-foreground !w-8 !h-8"; 
        return "border-purple-400 text-purple-300"; 
      case "MEASURE": return "border-gray-400 text-gray-300";
      case "S": case "T": case "I":
      case "RX": case "RY": case "RZ": case "PHASE":
      case "U1": case "U2": case "U3":
      case "SDG": case "TDG": 
      case "CY": case "CZ": case "SWAP": case "ISWAP":
      case "CPHASE": case "CRX": case "CRY": case "CRZ":
      case "TOFFOLI": case "FREDKIN": case "CCZ":
      case "MEASURE_ALL": case "RESET":
        return defaultNewGateClasses; 
      default: return "border-foreground";
    }
  };

  const formatParamValue = (value: any): string => {
    if (typeof value === 'number') {
      // For angles, often displayed in terms of pi or degrees.
      // For now, simple decimal, could be enhanced.
      // Check if it's close to a multiple of PI/2
      if (Math.abs(value - Math.PI / 2) < 0.01) return "π/2";
      if (Math.abs(value - Math.PI) < 0.01) return "π";
      if (Math.abs(value - (3 * Math.PI / 2)) < 0.01) return "3π/2";
      if (Math.abs(value - 2 * Math.PI) < 0.01) return "2π";
      if (Math.abs(value) < 0.01) return "0";
      return value.toFixed(2);
    }
    return String(value);
  };
  
  const gateDisplayContent = () => {
    const iconSize = isPaletteItem ? 18 : 20;

    if (isPaletteItem && displayText) return displayText; 

    if (isControl) return "●"; 
    if (isTarget && type === "CNOT") return "⊕"; 
    if (isTargetSymbol) { 
        if (type === "CY") return "Y";
        if (type === "CZ") return "Z";
        if (type === "CPHASE" && params?.theta !== undefined) return `P(${formatParamValue(params.theta)})`;
        if (type === "CPHASE") return "P";
        if (type === "CRX" && params?.theta !== undefined) return `RX(${formatParamValue(params.theta)})`;
        if (type === "CRX") return "RX";
        if (type === "CRY" && params?.theta !== undefined) return `RY(${formatParamValue(params.theta)})`;
        if (type === "CRY") return "RY";
        if (type === "CRZ" && params?.theta !== undefined) return `RZ(${formatParamValue(params.theta)})`;
        if (type === "CRZ") return "RZ";
        if (type === "TOFFOLI") return "⊕"; 
        if (type === "FREDKIN") return "✕"; 
        if (type === "CCZ") return "Z"; 
        return type; 
    }
    
    const gateInfo = GATE_INFO_MAP.get(type);

    if (gateInfo?.paramDetails && params) {
        let mainPart = type;
        if (type === "PHASE") mainPart = "P";
        else if (type === "TOFFOLI") mainPart = "CCX";
        else if (type === "FREDKIN") mainPart = "CSWAP";
        
        const paramStrings = gateInfo.paramDetails.map(p => {
            const val = params[p.name];
            return val !== undefined ? formatParamValue(val) : p.name;
        });
        if (paramStrings.length > 0) return `${mainPart}(${paramStrings.join(',')})`;
    }

    switch (type) {
      case "MEASURE": return <Activity size={iconSize} />;
      case "RESET": return <Eraser size={iconSize} />;
      case "MEASURE_ALL": return <ListChecks size={iconSize} />;
      case "SDG": return "S†";
      case "TDG": return "T†";
      case "PHASE": return "P"; // Default if no params
      case "TOFFOLI": return "CCX"; 
      case "FREDKIN": return "CSWAP"; 
      case "CY": return "CY"; 
      case "CZ": return "CZ";
      case "CPHASE": return "CP";
      case "CRX": return "CRX";
      case "CRY": return "CRY";
      case "CRZ": return "CRZ";
      case "SWAP": return "SWAP"; 
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

