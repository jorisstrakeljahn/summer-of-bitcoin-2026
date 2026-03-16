/**
 * Custom tooltip for Recharts that shows formatted labels and values on hover.
 */
"use client";

import type { TooltipProps } from "recharts";

interface ChartTooltipEntry {
  color?: string;
  name?: string;
  value?: number;
}

interface Props extends TooltipProps<number, string> {
  formatValue?: (value: number, name: string) => string;
}

export function ChartTooltip({ active, payload, label, formatValue }: Props) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      {label && (
        <p className="mb-1.5 font-medium text-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry: ChartTooltipEntry, i: number) => (
          <div key={i} className="flex items-center gap-2">
            {entry.color && (
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-mono font-medium tabular-nums">
              {formatValue
                ? formatValue(entry.value ?? 0, entry.name ?? "")
                : (entry.value ?? 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
