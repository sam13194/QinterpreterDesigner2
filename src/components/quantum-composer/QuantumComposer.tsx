
"use client";

import { useCircuitState } from "@/hooks/useCircuitState";
import { GatePalette } from "./GatePalette";
import { CircuitCanvas } from "./CircuitCanvas";
import { SimulationResults } from "./SimulationResults";
import { CircuitControls } from "./CircuitControls";
import { AISuggestionPanel } from "./AISuggestionPanel";
import React, { useState, useCallback, useEffect } from "react";
import type { PaletteGateInfo, SimulationResult, Gate, GateParamDetail, GateSymbol } from "@/lib/circuit-types";
import { GATE_INFO_MAP } from "@/lib/circuit-types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function QuantumComposer() {
  const {
    circuit,
    addQubit,
    removeQubit,
    updateNumQubits,
    addGate,
    removeGate,
    updateGateParam,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGateDragStart = (e: React.DragEvent<HTMLDivElement>, gateInfo: PaletteGateInfo) => {
    e.dataTransfer.setData("gateInfo", JSON.stringify(gateInfo));
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
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNumQubitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      updateNumQubits(circuit.numQubits); 
    } else {
      const num = parseInt(value, 10);
      updateNumQubits(isNaN(num) ? circuit.numQubits : num);
    }
  };

  const handleSelectGate = useCallback((gateId: string | null) => {
    setSelectedGateId(gateId);
  }, []);

  const selectedGate: Gate | undefined = circuit.gates.find(g => g.id === selectedGateId);
  const selectedGatePaletteInfo: PaletteGateInfo | undefined = selectedGate ? GATE_INFO_MAP.get(selectedGate.type) : undefined;

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-background text-foreground overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-2 left-2 z-50 bg-card/80 backdrop-blur-sm"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Sidebar"
      >
        <PanelLeftOpen />
      </Button>

      <aside
        className={`
          fixed md:static z-40 h-full transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 w-72 md:w-80 border-r border-border bg-card flex flex-col shadow-lg
        `}
      >
        <ScrollArea className="flex-grow p-4">
          <div className="space-y-6">
            <GatePalette onGateDragStart={handleGateDragStart} />
            
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="font-headline text-xl">Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-md font-medium text-primary-foreground">Circuit Settings</h3>
                  <Separator className="mb-3" />
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="circuitName" className="text-sm">Circuit Name</Label>
                      <Input
                        id="circuitName"
                        value={circuit.name || ""}
                        onChange={(e) => updateCircuitName(e.target.value)}
                        placeholder="My Quantum Circuit"
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="numQubits" className="text-sm">Number of Qubits</Label>
                      <Input
                        id="numQubits"
                        type="number"
                        value={circuit.numQubits}
                        onChange={handleNumQubitsChange}
                        min="1"
                        max="16"
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="numShots" className="text-sm">Number of Shots</Label>
                      <Input
                        id="numShots"
                        type="number"
                        value={circuit.shots || 1000}
                        onChange={(e) => updateNumShots(parseInt(e.target.value, 10))}
                        min="1"
                        step="100"
                        className="mt-1 h-9"
                      />
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div>
                     <h3 className="mb-2 text-md font-medium text-primary-foreground">Gate Parameters</h3>
                     <Separator className="mb-3" />
                     {selectedGate && selectedGatePaletteInfo?.paramDetails ? (
                       <div className="space-y-3">
                         <p className="text-xs text-muted-foreground">Editing: {selectedGatePaletteInfo.displayName} (ID: ...{selectedGate.id.slice(-4)})</p>
                         {selectedGatePaletteInfo.paramDetails.map((param: GateParamDetail) => (
                           <div key={param.name}>
                             <Label htmlFor={`param-${param.name}`} className="text-sm">{param.displayName || param.name}</Label>
                             <Input
                               id={`param-${param.name}`}
                               type={param.type === 'angle' || param.type === 'number' ? 'number' : 'text'}
                               value={selectedGate.params?.[param.name] ?? ""}
                               onChange={(e) => {
                                 let value: string | number = e.target.value;
                                 if (param.type === 'angle' || param.type === 'number') {
                                   value = parseFloat(e.target.value);
                                   if (isNaN(value)) value = selectedGate.params?.[param.name] ?? param.defaultValue; 
                                 }
                                 updateGateParam(selectedGate.id, param.name, value);
                               }}
                               step={param.type === 'angle' ? "0.01" : (param.type === 'number' ? "1" : undefined)}
                               className="mt-1 h-9"
                             />
                           </div>
                         ))}
                       </div>
                     ) : (
                       <p className="text-xs text-muted-foreground">Select a gate on the canvas to edit its parameters. Barriers do not have parameters.</p>
                     )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden">
        <CircuitControls
          circuit={getFullCircuit()}
          onNewCircuit={() => { clearCircuit(); setSelectedGateId(null); }}
          onLoadCircuit={(loadedCirc) => { loadCircuit(loadedCirc); setSelectedGateId(null); }}
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
            onRemoveGate={(gateId) => { removeGate(gateId); if(selectedGateId === gateId) setSelectedGateId(null);}}
            onAddColumn={addColumn}
            onSelectGate={handleSelectGate}
          />
        </div>

        <div className="h-60 md:h-72 border-t border-border pt-2 md:pt-4">
          <SimulationResults results={simulationResult} isLoading={isSimulating} />
        </div>
      </main>

      <Sheet open={isAISuggestionOpen} onOpenChange={setIsAISuggestionOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-card border-l border-border flex flex-col p-0 overflow-hidden">
          <SheetHeader className="p-6 pb-4 border-b border-border shrink-0">
            <SheetTitle>AI Gate Suggestion</SheetTitle>
            <SheetDescription>
              Get intelligent recommendations for your next gate or circuit modifications.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div className="p-6">
              <AISuggestionPanel currentCircuit={getFullCircuit()} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
