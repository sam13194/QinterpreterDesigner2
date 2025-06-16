"use client";

import type { SimulationResult } from "@/lib/circuit-types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";

interface SimulationResultsProps {
  results: SimulationResult | null;
  isLoading: boolean;
}

export function SimulationResults({ results, isLoading }: SimulationResultsProps) {
  if (isLoading) {
    return (
      <Card className="h-full shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Simulation Results</CardTitle>
          <CardDescription>Running simulation...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-4/5">
          <div className="text-muted-foreground">Loading results...</div>
        </CardContent>
      </Card>
    );
  }

  if (!results || Object.keys(results.counts).length === 0) {
    return (
      <Card className="h-full shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Simulation Results</CardTitle>
          <CardDescription>No simulation data available. Run a simulation to see results.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-4/5">
           <div className="text-muted-foreground">No data</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(results.counts).map(([state, count]) => ({
    state,
    count,
    probability: count / Object.values(results.counts).reduce((sum, c) => sum + c, 0),
  })).sort((a,b) => a.state.localeCompare(b.state)); // Sort by state string

  const chartConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--primary))",
    },
    probability: {
        label: "Probability",
        color: "hsl(var(--accent))",
    }
  } satisfies ChartConfig;


  return (
    <Card className="h-full shadow-xl flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Simulation Results</CardTitle>
        <CardDescription>Histogram of measurement outcomes (1000 shots default).</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="state" 
              tickLine={false} 
              axisLine={false} 
              stroke="hsl(var(--foreground))" 
              angle={-45}
              textAnchor="end"
              height={50}
              interval={0}
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              tickLine={false} 
              axisLine={false} 
            />
            <RechartsTooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
