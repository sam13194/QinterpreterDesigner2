
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">Simulating circuit...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm p-6">
        <p className="text-muted-foreground">No simulation results yet. Run a simulation.</p>
      </div>
    );
  }

  if (Object.keys(results.counts).length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-sm p-6">
            <p className="text-muted-foreground">Simulation ran, but no counts were returned.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="min-h-[200px] flex-shrink-0"> {/* Ensure chart has enough space */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
            <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} barSize={Math.min(30, 600 / chartData.length)} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 min-h-0"> {/* Allow table to take remaining space and scroll */}
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
    </div>
  );
}

