/**
 * Pie chart showing the distribution of script types (P2WPKH, P2TR, etc.) in a block.
 */
"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { InfoButton } from "@/components/info-panel";
import { INFO } from "@/lib/info-content";
import { SCRIPT_TYPE_COLORS, SCRIPT_TYPE_LABELS } from "@/lib/constants";

interface Props {
  distribution: Record<string, number>;
}

export function ScriptTypeChart({ distribution }: Props) {
  const entries = Object.entries(distribution)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const total = entries.reduce((s, [, v]) => s + v, 0);

  const chartData = entries.map(([type, count]) => ({
    name: SCRIPT_TYPE_LABELS[type] ?? type,
    value: count,
    color: SCRIPT_TYPE_COLORS[type] ?? "#6b7280",
  }));

  return (
    <div className="rounded-xl bg-card p-5">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-sm font-semibold">Script Type Distribution</h3>
        <InfoButton title={INFO.scriptTypeDistribution.title}>
          {INFO.scriptTypeDistribution.body}
        </InfoButton>
      </div>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="h-36 w-36 shrink-0 sm:h-48 sm:w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="65%"
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltip
                    formatValue={(v) =>
                      `${v.toLocaleString()} (${((v / total) * 100).toFixed(1)}%)`
                    }
                  />
                }
                wrapperStyle={{ zIndex: 50 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full flex-1 space-y-1.5">
          {chartData.map((entry) => (
            <div
              key={entry.name}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
              </div>
              <span className="font-mono text-muted-foreground">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
