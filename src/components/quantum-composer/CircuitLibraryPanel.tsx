
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PREDEFINED_CIRCUITS, type LibraryCircuitInfo, type LibraryCategory } from "@/lib/circuit-library";
import type { VisualCircuit } from '@/lib/circuit-types';
import { BookMarked } from 'lucide-react';

interface CircuitLibraryPanelProps {
  onLoadCircuit: (circuit: VisualCircuit) => void; 
}

export function CircuitLibraryPanel({ onLoadCircuit }: CircuitLibraryPanelProps) {
  
  const handleLoadPredefined = (circuitInfo: LibraryCircuitInfo) => {
    console.log("Loading circuit from library (placeholder):", circuitInfo.name);
    
    if (circuitInfo.id === 'bell_phi_plus') {
        onLoadCircuit({
            name: circuitInfo.name,
            numQubits: 2,
            shots: 1000,
            gates: [
                { id: 'g1', type: 'H', qubits: [0], column: 0 },
                { id: 'g2', type: 'CNOT', qubits: [0, 1], column: 1 },
                { id: 'm1', type: 'MEASURE_ALL', qubits: [0,1], column: 2}
            ],
        });
    } else {
        onLoadCircuit({
            name: `Loaded: ${circuitInfo.name}`,
            numQubits: 3,
            shots: 1000,
            gates: [{ id: 'sample_h', type: 'H', qubits: [0], column: 0}],
        });
    }
  };

  return (
    <Card className="shadow-md flex flex-col flex-1 min-h-0"> {/* Ensure card can flex */}
      <CardHeader className="py-3">
        <CardTitle className="font-headline text-lg flex items-center">
          <BookMarked className="mr-2 h-5 w-5 text-primary" /> Circuit Library
        </CardTitle>
        <CardDescription className="text-xs">Load predefined circuits.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-0"> {/* Allow content to take space and scroll */}
        <ScrollArea className="h-full px-1"> {/* ScrollArea takes full height of its flex parent */}
          <Accordion type="multiple" defaultValue={PREDEFINED_CIRCUITS.map(cat => cat.id)} className="w-full">
            {PREDEFINED_CIRCUITS.map((category: LibraryCategory) => (
              <AccordionItem value={category.id} key={category.id}>
                <AccordionTrigger className="text-xs hover:no-underline py-2">
                  {category.name}
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <div className="space-y-1">
                    {category.circuits.map((circuit: LibraryCircuitInfo) => (
                      <Button
                        key={circuit.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-auto py-1.5 px-2"
                        onClick={() => handleLoadPredefined(circuit)}
                        title={circuit.description}
                      >
                        {circuit.name}
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
             <AccordionItem value="custom_gates_placeholder" disabled>
                <AccordionTrigger className="text-xs hover:no-underline py-2 text-muted-foreground/70">
                  Custom Gates (Soon)
                </AccordionTrigger>
                <AccordionContent className="pb-1 text-xs text-muted-foreground">
                    Save and manage your own circuits here in the future.
                </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
