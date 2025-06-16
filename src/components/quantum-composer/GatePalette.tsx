
"use client";

import { GATE_CATEGORIES, GATE_CATEGORY_NAMES, type PaletteGateInfo } from "@/lib/circuit-types";
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
    <Card className="shadow-xl flex flex-col flex-1 min-h-0"> {/* Ensure card can flex */}
      <CardHeader>
        <CardTitle className="font-headline text-xl">Gate Palette</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-0">  {/* Allow content to take space and scroll */}
        <ScrollArea className="h-full px-3"> {/* ScrollArea takes full height of its flex parent */}
          <Accordion type="multiple" defaultValue={GATE_CATEGORY_NAMES} className="w-full">
            {GATE_CATEGORIES.map((gateListForCategory, index) => (
              <AccordionItem value={GATE_CATEGORY_NAMES[index]} key={GATE_CATEGORY_NAMES[index]}>
                <AccordionTrigger className="text-sm hover:no-underline">
                  {GATE_CATEGORY_NAMES[index]}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3 p-1">
                    {gateListForCategory.map((gate) => (
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
