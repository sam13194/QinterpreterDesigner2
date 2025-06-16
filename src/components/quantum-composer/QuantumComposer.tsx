"use client";

import { useCircuitState } from "@/hooks/useCircuitState";
import { GatePalette } from "./GatePalette";
import { CircuitCanvas } from "./CircuitCanvas";
import { SimulationResults } from "./SimulationResults";
import { CircuitControls } from "./CircuitControls";
import { AISuggestionPanel } from "./AISuggestionPanel";
import React, { useState, useCallback, useEffect } from "react";
import type { GateSymbol, SimulationResult, VisualCircuit } from "@/lib/circuit-types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function QuantumComposer() {
  const {
    circuit,
    addQubit,
    removeQubit,
    addGate,
    removeGate,
    clearCircuit,
    loadCircuit,
    getFullCircuit,
    updateCircuitName,
    updateNumShots,
    addColumn,
  } = useCircuitState();
  
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAISuggestionOpen, setIsAISuggestionOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open on desktop
  const { toast } = useToast();

  const handleGateDragStart = (e: React.DragEvent<HTMLDivElement>, type: GateSymbol) => {
    e.dataTransfer.setData("gateType", type);
  };

  const handleSimulate = useCallback(async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const currentCircuitState = getFullCircuit();
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentCircuitState),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Simulation failed with status: ${response.status}`);
      }
      const data: SimulationResult = await response.json();
      setSimulationResult(data);
      toast({ title: "Simulation Complete", description: "Results are now displayed." });
    } catch (error) {
      console.error("Simulation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown simulation error.";
      toast({ variant: "destructive", title: "Simulation Error", description: errorMessage });
    } finally {
      setIsSimulating(false);
    }
  }, [getFullCircuit, toast]);
  
  // Toggle sidebar for smaller screens, manage AI panel sheet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Toggle for Mobile/Tablet */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden fixed top-2 left-2 z-50 bg-card/80 backdrop-blur-sm"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Sidebar"
      >
        <PanelLeftOpen />
      </Button>

      {/* Sidebar: GatePalette and Circuit Settings */}
      <aside 
        className={`
          fixed md:static z-40 h-full transition-transform duration-300 ease-in-out 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 w-72 md:w-64 border-r border-border bg-card flex flex-col p-4 space-y-6 shadow-lg
        `}
      >
        <ScrollArea className="flex-grow">
          <div className="space-y-6">
            <div>
              <Label htmlFor="circuitName" className="font-headline text-lg">Circuit Name</Label>
              <Input 
                id="circuitName"
                value={circuit.name || ""}
                onChange={(e) => updateCircuitName(e.target.value)}
                placeholder="My Quantum Circuit"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="numShots" className="font-headline text-lg">Number of Shots</Label>
              <Input 
                id="numShots"
                type="number"
                value={circuit.shots || 1000}
                onChange={(e) => updateNumShots(parseInt(e.target.value, 10) || 1000)}
                min="1"
                step="100"
                className="mt-1"
              />
            </div>
            <GatePalette onGateDragStart={handleGateDragStart} />
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden">
        <CircuitControls
          circuit={getFullCircuit()}
          onNewCircuit={clearCircuit}
          onLoadCircuit={loadCircuit}
          onSimulate={handleSimulate}
          isSimulating={isSimulating}
          onOpenAISuggestions={() => setIsAISuggestionOpen(true)}
        />
        
        <div className="flex-grow my-2 md:my-4 overflow-hidden min-h-[300px] md:min-h-[400px]">
          <CircuitCanvas
            circuit={circuit}
            onAddQubit={addQubit}
            onRemoveQubit={removeQubit}
            onAddGate={addGate}
            onRemoveGate={removeGate}
            onAddColumn={addColumn}
          />
        </div>

        <div className="h-60 md:h-72 border-t border-border pt-2 md:pt-4">
          <SimulationResults results={simulationResult} isLoading={isSimulating} />
        </div>
      </main>

      {/* AI Suggestion Sheet (Modal) */}
       <Sheet open={isAISuggestionOpen} onOpenChange={setIsAISuggestionOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-card border-border p-0 overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-6">
              <AISuggestionPanel currentCircuit={getFullCircuit()} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
