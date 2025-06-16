
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
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary-foreground">Gate Palette</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Adjusted max-height. Consider further adjustments based on overall sidebar layout. */}
        <ScrollArea className="max-h-[calc(100vh-250px)] pr-3"> 
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
