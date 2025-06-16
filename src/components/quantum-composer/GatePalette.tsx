
"use client";

import { GATE_CATEGORIES, type PaletteGateInfo } from "@/lib/circuit-types";
import { GateIcon } from "./GateIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GatePaletteProps {
  onGateDragStart: (e: React.DragEvent<HTMLDivElement>, gateInfo: PaletteGateInfo) => void;
}

export function GatePalette({ onGateDragStart }: GatePaletteProps) {
  return (
    <Card className="shadow-xl flex flex-col flex-1 min-h-0">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Gate Palette</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-0"> 
        <ScrollArea className="h-full px-3"> 
          <Accordion type="multiple" defaultValue={GATE_CATEGORIES.map(cat => cat.name)} className="w-full">
            {GATE_CATEGORIES.map((category) => (
              <AccordionItem value={category.name} key={category.name}>
                <AccordionTrigger className="text-sm hover:no-underline">
                  {category.name}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3 p-1">
                    {category.gates.map((gate) => (
                      <GateIcon
                        key={gate.type}
                        type={gate.type}
                        displayText={gate.displayName}
                        paletteTooltip={gate.tooltip}
                        isPaletteItem
                        draggable
                        onDragStart={(e) => onGateDragStart(e, gate)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
