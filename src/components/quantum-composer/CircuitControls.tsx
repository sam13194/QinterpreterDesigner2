
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { VisualCircuit } from "@/lib/circuit-types";
import { FileDown, FileUp, Play, PlusSquare, Brain, PanelRightOpen, PanelRightClose } from "lucide-react"; // BarChartBig removed
import React, { useRef } from "react";

interface CircuitControlsProps {
  circuit: VisualCircuit;
  onNewCircuit: () => void;
  onLoadCircuit: (circuit: VisualCircuit) => void;
  onSimulate: () => void;
  isSimulating: boolean;
  onOpenAISuggestions: () => void;
  // isRightPanelVisible: boolean; // Removed
  // onToggleRightPanel: () => void; // Removed
}

export function CircuitControls({
  circuit,
  onNewCircuit,
  onLoadCircuit,
  onSimulate,
  isSimulating,
  onOpenAISuggestions,
  // isRightPanelVisible, // Removed
  // onToggleRightPanel, // Removed
}: CircuitControlsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveCircuit = () => {
    try {
      const circuitJson = JSON.stringify(circuit, null, 2);
      const blob = new Blob([circuitJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = circuit.name ? `${circuit.name.replace(/\s+/g, '_')}.json` : "quantum_circuit.json";
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Circuit Saved", description: `${fileName} downloaded successfully.` });
    } catch (error) {
      console.error("Failed to save circuit:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save circuit." });
    }
  };

  const handleOpenCircuit = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const loadedCircuit = JSON.parse(content) as VisualCircuit;
          if (typeof loadedCircuit.numQubits === 'number' && Array.isArray(loadedCircuit.gates)) {
            onLoadCircuit(loadedCircuit);
            toast({ title: "Circuit Loaded", description: `${file.name} loaded successfully.` });
          } else {
            throw new Error("Invalid circuit file format.");
          }
        } catch (error) {
          console.error("Failed to load circuit:", error);
          toast({ variant: "destructive", title: "Load Error", description: `Could not load circuit from ${file.name}. Ensure it's a valid JSON circuit file.` });
        }
      };
      reader.readAsText(file);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-card rounded-lg shadow-md mb-4 border border-border w-full">
      <Button onClick={onNewCircuit} variant="outline" size="sm" aria-label="New Circuit">
        <PlusSquare className="mr-2 h-4 w-4" /> New
      </Button>
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" aria-label="Open Circuit from JSON">
        <FileUp className="mr-2 h-4 w-4" /> Open
      </Button>
      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleOpenCircuit}
        aria-hidden="true"
      />
      <Button onClick={handleSaveCircuit} variant="outline" size="sm" aria-label="Save Circuit as JSON">
        <FileDown className="mr-2 h-4 w-4" /> Save
      </Button>
      <Button onClick={onSimulate} disabled={isSimulating} size="sm" aria-label="Simulate Circuit">
        <Play className="mr-2 h-4 w-4" /> {isSimulating ? "Simulating..." : "Simulate"}
      </Button>
      <Button onClick={onOpenAISuggestions} variant="outline" size="sm" className="bg-primary/20 hover:bg-primary/40 text-primary-foreground border-primary" aria-label="Get AI Gate Suggestions">
        <Brain className="mr-2 h-4 w-4" /> AI Suggest
      </Button>
      {/* Removed Results Toggle Button */}
      {/* <Button onClick={onToggleRightPanel} variant="outline" size="sm" aria-label={isRightPanelVisible ? "Hide Results Panel" : "Show Results Panel"}>
        {isRightPanelVisible ? <PanelRightClose className="mr-2 h-4 w-4" /> : <PanelRightOpen className="mr-2 h-4 w-4" />}
        Results
      </Button> */}
    </div>
  );
}
