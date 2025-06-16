
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SimulationResult } from '@/lib/circuit-types';
import { Loader2 } from 'lucide-react';

interface SimulationResultsProps {
  results: SimulationResult | null;
  isLoading: boolean;
}

export function SimulationResults({ results, isLoading }: SimulationResultsProps) {
  const chartData = results?.counts
    ? Object.entries(results.counts).map(([state, count]) => ({ state, count })).sort((a,b) => b.count - a.count)
    : [];

  return (
    <Card className="shadow-xl flex flex-col flex-1 min-h-0 h-full">
      <CardHeader className="py-4">
        <CardTitle className="font-headline text-lg flex items-center">
          Simulation Results
        </CardTitle>
        <CardDescription className="text-xs">Measurement outcomes from the simulation.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pt-0 space-y-3 p-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center flex-1 h-full text-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Simulating circuit...</p>
          </div>
        )}
        {!isLoading && !results && (
          <div className="flex flex-col items-center justify-center flex-1 h-full text-sm">
            <p className="text-muted-foreground">No simulation results yet. Run a simulation.</p>
          </div>
        )}
        {!isLoading && results && Object.keys(results.counts).length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 h-full text-sm">
                <p className="text-muted-foreground">Simulation ran, but no counts were returned.</p>
            </div>
        )}
        {!isLoading && results && Object.keys(results.counts).length > 0 && (
          <>
            <div className="min-h-[150px] max-h-[35vh] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="state" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false}/>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontSize: '12px',
                      padding: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Legend wrapperStyle={{fontSize: "10px", paddingTop: "10px"}}/>
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full pr-2">
                <Table className="text-xs">
                    <TableHeader>
                    <TableRow>
                        <TableHead className="h-8">State</TableHead>
                        <TableHead className="text-right h-8">Counts</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {chartData.map((item) => (
                        <TableRow key={item.state} className="h-8">
                        <TableCell className="font-mono py-1">{item.state}</TableCell>
                        <TableCell className="text-right font-mono py-1">{item.count}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
