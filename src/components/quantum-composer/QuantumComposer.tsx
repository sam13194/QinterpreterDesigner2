
"use client";

import { useCircuitState } from "@/hooks/useCircuitState";
import { GatePalette } from "./GatePalette";
import { CircuitCanvas } from "./CircuitCanvas";
import { CircuitControls } from "./CircuitControls";
import { AISuggestionPanel } from "./AISuggestionPanel";
import React, { useState, useCallback, useEffect } from "react";
import type { PaletteGateInfo, Gate, GateParamDetail, VisualCircuit, SimulationResult } from "@/lib/circuit-types";
import { GATE_INFO_MAP } from "@/lib/circuit-types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription as ShadCardDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { visualCircuitToQinterpreterCode } from "@/lib/qinterpreter-converter";
import { CircuitLibraryPanel } from "./CircuitLibraryPanel";
import { SimulationResults } from "./SimulationResults";


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
  const [isSimulating, setIsSimulating] = useState(false); // For main simulation button
  const [isAISuggestionOpen, setIsAISuggestionOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [qInterpreterCode, setQInterpreterCode] = useState<string>("");
  const [isCodePanelExpanded, setIsCodePanelExpanded] = useState(true);
  const [isResultsSheetOpen, setIsResultsSheetOpen] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [isScriptRunning, setIsScriptRunning] = useState<boolean>(false);


  const { toast } = useToast();

  useEffect(() => {
    const currentFullCircuit = getFullCircuit();
    setQInterpreterCode(visualCircuitToQinterpreterCode(currentFullCircuit));
  }, [circuit, getFullCircuit]);

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
      setIsResultsSheetOpen(true); 
      toast({ title: "Simulation Complete", description: "Results are now available." });
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
      if (window.innerWidth < 768 && isSidebarOpen) { 
        setIsSidebarOpen(false);
      } else if (window.innerWidth >= 768 && !isSidebarOpen) {
        // setIsSidebarOpen(true); // Keep sidebar state based on user preference on larger screens
      }
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]); 


  const handleNumQubitsChangeInternal = (newCount: number | string) => {
     if (typeof newCount === 'string') {
        const num = parseInt(newCount, 10);
        if (!isNaN(num)) {
            updateNumQubits(num);
        }
     } else {
        updateNumQubits(newCount);
     }
  };
  
  const handleNumShotsChangeInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const num = parseInt(value, 10);
    updateNumShots(isNaN(num) ? (circuit.shots || 1000) : num);
  };

  const handleCircuitNameChangeInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCircuitName(e.target.value);
  };

  const handleSelectGate = useCallback((gateId: string | null) => {
    setSelectedGateId(gateId);
  }, []);

  const selectedGate: Gate | undefined = circuit.gates.find(g => g.id === selectedGateId);
  const selectedGatePaletteInfo: PaletteGateInfo | undefined = selectedGate ? GATE_INFO_MAP.get(selectedGate.type) : undefined;

  const toggleCodePanelExpand = () => setIsCodePanelExpanded(prev => !prev);

  const handleRunQinterpreterScript = useCallback(async () => {
    setIsScriptRunning(true);
    setConsoleOutput("Running Qinterpreter script...\n");
    let output = "";
    const currentCircuitVisual = getFullCircuit();

    if (qInterpreterCode.includes("simulate_circuit(")) {
      output += `\nAttempting to simulate circuit (using mock API based on current visual design)...\n`;
      try {
        // Simulate a short delay for script execution feel
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
        const response = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentCircuitVisual),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Script simulation failed with status: ${response.status}`);
        }
        const data: SimulationResult = await response.json();
        output += `Results from simulate_circuit: ${JSON.stringify(data.counts)}\n\n`;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error during script simulation.";
        output += `Error during script simulation: ${errorMsg}\n\n`;
      }
    }

    if (qInterpreterCode.includes("bloch_sphere(")) {
      output += "bloch_sphere(qc) called. (In a real Python environment, this would display interactive Bloch spheres).\n\n";
    }

    const translateMatch = qInterpreterCode.match(/translate_to_framework\(qc, ["'](.+?)["']\)/);
    if (translateMatch) {
      const framework = translateMatch[1];
      output += `translate_to_framework(qc, "${framework}") called. (In a real Python environment, this would print the circuit in ${framework} format).\n\n`;
    }
    
    // Check for simple print statements if no specific commands found
    if (output === "" && qInterpreterCode.includes("print(")) {
        output += "Script contains print() statements. Output would appear here in a real Python environment.\n";
    }


    if (output === "") { // If no specific qinterpreter actions were found to mock
      output = "Qinterpreter script execution finished. No specific output actions (simulate_circuit, bloch_sphere, translate_to_framework) were detected in the generated code for this mock execution.\n";
    }
    
    setConsoleOutput(prev => prev + output.trim());
    setIsScriptRunning(false);
  }, [qInterpreterCode, getFullCircuit, setConsoleOutput]);

  const handleClearConsole = useCallback(() => {
    setConsoleOutput("");
  }, [setConsoleOutput]);


  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-background text-foreground overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-2 left-2 z-50 bg-card/80 backdrop-blur-sm md:absolute"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Sidebar"
      >
        {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
      </Button>

      <aside
        className={`
          fixed md:static z-40 h-full transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          w-72 md:w-80 border-r border-border bg-card flex flex-col shadow-lg shrink-0
        `}
      >
        {isSidebarOpen && (
        <div className="flex flex-col flex-1 min-h-0 pt-10 md:pt-0"> 
            <ScrollArea className="flex-grow min-h-0"> 
                <div className="p-4 space-y-4 flex flex-col h-full"> 
                    <GatePalette onGateDragStart={handleGateDragStart} />
                    
                     <Card className="shadow-md shrink-0">
                        <Accordion type="single" collapsible defaultValue="gate-parameters">
                            <AccordionItem value="gate-parameters">
                                <AccordionTrigger className="text-base px-4 py-3 font-headline text-sm">Gate Parameters</AccordionTrigger>
                                <AccordionContent className="px-4 pb-3">
                                    <div className="space-y-1 text-sm min-h-[70px]">
                                        {selectedGate && selectedGatePaletteInfo?.paramDetails ? (
                                        <div className="space-y-3">
                                            <p className="text-xs text-muted-foreground">Editing: {selectedGatePaletteInfo.displayName} (ID: ...{selectedGate.id.slice(-4)})</p>
                                            {selectedGatePaletteInfo.paramDetails.map((param: GateParamDetail) => (
                                            <div key={param.name}>
                                                <Label htmlFor={`param-${param.name}`} className="text-xs">{param.displayName || param.name}</Label>
                                                <Input
                                                id={`param-${param.name}`}
                                                type={param.type === 'angle' || param.type === 'number' ? 'number' : 'text'}
                                                value={selectedGate.params?.[param.name] ?? ""}
                                                onChange={(e) => {
                                                    let value: string | number = e.target.value;
                                                    if (param.type === 'angle' || param.type === 'number') {
                                                    const parsedValue = parseFloat(e.target.value);
                                                    value = isNaN(parsedValue) ? (param.defaultValue !== undefined ? param.defaultValue : 0) : parsedValue;
                                                    }
                                                    updateGateParam(selectedGate.id, param.name, value);
                                                }}
                                                step={param.type === 'angle' ? (Math.PI / 16).toFixed(4) : (param.type === 'number' ? "1" : undefined)}
                                                className="mt-1 h-8 text-xs"
                                                />
                                            </div>
                                            ))}
                                        </div>
                                        ) : (
                                        <p className="text-xs text-muted-foreground">Select a gate on the canvas to edit its parameters.</p>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                    <CircuitLibraryPanel onLoadCircuit={(circuitData) => {
                        loadCircuit(circuitData);
                        setSelectedGateId(null);
                        toast({ title: "Circuit Loaded", description: `${circuitData.name || "Library circuit"} loaded.`});
                    }} />
                </div>
            </ScrollArea>
        </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 flex flex-col p-3 md:p-6 overflow-auto min-w-0">
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
                circuitName={circuit.name || ""}
                onCircuitNameChange={handleCircuitNameChangeInternal}
                numQubits={circuit.numQubits}
                onNumQubitsChange={handleNumQubitsChangeInternal}
                numShots={circuit.shots || 1000}
                onNumShotsChange={handleNumShotsChangeInternal}
                onAddQubit={addQubit}
                onRemoveQubit={removeQubit}
                onAddGate={addGate}
                onRemoveGate={(gateId) => { removeGate(gateId); if(selectedGateId === gateId) setSelectedGateId(null);}}
                onAddColumn={addColumn}
                onSelectGate={handleSelectGate}
              />
            </div>

            <div className="border-t border-border pt-2 md:pt-4">
               <CodeEditorPanel 
                 qinterpreterCode={qInterpreterCode} 
                 consoleOutput={consoleOutput}
                 onRunScript={handleRunQinterpreterScript}
                 isScriptRunning={isScriptRunning}
                 onClearConsole={handleClearConsole}
                 isExpanded={isCodePanelExpanded}
                 onToggleExpand={toggleCodePanelExpand}
                 isResultsSheetOpen={isResultsSheetOpen}
                 onToggleResultsSheet={setIsResultsSheetOpen}
                 simulationResult={simulationResult}
                 isSimulating={isSimulating} // This is for the main simulation, for enabling/disabling "View Results"
                />
            </div>
        </div>
      </main>

      <Sheet open={isAISuggestionOpen} onOpenChange={setIsAISuggestionOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-card border-l border-border flex flex-col p-0 overflow-hidden">
          <SheetHeader className="p-6 pb-4 border-b border-border shrink-0">
            <SheetTitle className="font-headline">AI Gate Suggestion</SheetTitle>
            <ShadCardDescription> 
              Get intelligent recommendations for your next gate or circuit modifications.
            </ShadCardDescription>
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

