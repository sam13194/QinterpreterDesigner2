"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AVAILABLE_GATES, type VisualCircuit } from "@/lib/circuit-types";
import { Brain, Lightbulb, AlertTriangle } from "lucide-react";
import React, { useState } from "react";
import { getGateSuggestionAction } from "@/actions/circuitActions";
import type { SuggestNextGateOutput } from "@/ai/flows/suggest-next-gate";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AISuggestionPanelProps {
  currentCircuit: VisualCircuit;
}

export function AISuggestionPanel({ currentCircuit }: AISuggestionPanelProps) {
  const [desiredState, setDesiredState] = useState<string>("");
  const [suggestion, setSuggestion] = useState<SuggestNextGateOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await getGateSuggestionAction(
        currentCircuit,
        desiredState,
        AVAILABLE_GATES
      );

      if ("error" in result) {
        setError(result.error);
        toast({ variant: "destructive", title: "AI Suggestion Error", description: result.error });
      } else {
        setSuggestion(result);
        toast({ title: "AI Suggestion Received", description: "A new gate suggestion is available." });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "AI Suggestion Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" /> AI Gate Suggestion
        </CardTitle>
        <CardDescription>Get intelligent suggestions for your next gate.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="desiredState" className="text-sm font-medium">Desired Quantum State (Optional)</Label>
          <Input
            id="desiredState"
            type="text"
            value={desiredState}
            onChange={(e) => setDesiredState(e.target.value)}
            placeholder="e.g., Bell state, GHZ state, |1>"
            className="mt-1"
          />
        </div>
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
          {isLoading ? "Getting Suggestion..." : "Suggest Next Gate"}
        </Button>
      </CardContent>

      {(suggestion || error) && (
        <CardFooter className="flex-col items-start space-y-3 pt-4 border-t border-border">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/30 w-full">
              <div className="flex items-center font-medium">
                <AlertTriangle className="h-5 w-5 mr-2" /> Error
              </div>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          {suggestion && (
            <div className="p-3 rounded-md bg-accent/10 text-accent-foreground border border-accent/30 w-full">
              <div className="flex items-center font-medium text-accent">
                <Lightbulb className="h-5 w-5 mr-2" /> Suggestion
              </div>
              <p className="text-sm mt-2">
                <strong>Suggested Gate:</strong> {suggestion.suggestedGate}
              </p>
              <p className="text-sm mt-1">
                <strong>Reasoning:</strong>
              </p>
              <Textarea
                readOnly
                value={suggestion.reasoning}
                className="mt-1 h-24 bg-background/50 text-foreground"
                aria-label="AI reasoning for gate suggestion"
              />
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
