"use client";

import { AVAILABLE_GATES, type GateSymbol } from "@/lib/circuit-types";
import { GateIcon } from "./GateIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GatePaletteProps {
  onGateDragStart: (e: React.DragEvent<HTMLDivElement>, type: GateSymbol) => void;
}

export function GatePalette({ onGateDragStart }: GatePaletteProps) {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary-foreground">Gate Palette</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-full">
          <div className="grid grid-cols-2 gap-3 p-1">
            {AVAILABLE_GATES.map((gateType) => (
              <GateIcon
                key={gateType}
                type={gateType}
                isPaletteItem
                draggable
                onDragStart={(e) => onGateDragStart(e, gateType)}
                title={`Drag to add ${gateType} gate`}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
