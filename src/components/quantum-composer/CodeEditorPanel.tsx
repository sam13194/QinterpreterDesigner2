
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Play, Eraser } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeEditorPanelProps {
  qinterpreterCode: string;
  onCodeChange?: (code: string) => void; 
  onRun?: () => void;
  onClearConsole?: () => void;
  consoleOutput?: string;
}

export function CodeEditorPanel({
  qinterpreterCode,
  onCodeChange,
  onRun,
  onClearConsole,
  consoleOutput
}: CodeEditorPanelProps) {
  return (
    <Card className="shadow-xl flex flex-col flex-1 min-h-0 h-full border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-headline text-xl">Qinterpreter Code</CardTitle>
        <CardDescription>Generated Python code for the current circuit.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pt-0 space-y-2 p-3"> {/* Added p-3 here */}
        <ScrollArea className="flex-1 border border-input rounded-md">
          <Textarea
            value={qinterpreterCode}
            readOnly 
            className="h-full w-full font-code text-sm p-2 !min-h-[200px] resize-none border-0 focus-visible:ring-0 bg-background"
            placeholder="Qinterpreter code will appear here..."
            aria-label="Qinterpreter code editor"
          />
        </ScrollArea>
        <div className="flex items-center space-x-2 pt-1">
          <Button onClick={onRun} size="sm" disabled> 
            <Play className="mr-2 h-4 w-4" /> Run
          </Button>
          <Button onClick={onClearConsole} variant="outline" size="sm" disabled> 
            <Eraser className="mr-2 h-4 w-4" /> Clear Console
          </Button>
        </div>
        <div className="flex-1 flex flex-col space-y-1 pt-1">
          <p className="text-xs font-medium text-muted-foreground">Console Output:</p>
          <ScrollArea className="flex-1 border border-input rounded-md p-2 bg-muted/20">
            <pre className="text-xs font-code text-muted-foreground whitespace-pre-wrap !min-h-[100px]">
              {consoleOutput || "Console output will appear here..."}
            </pre>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
