"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from "@/lib/constants";
import type { ClassificationDistribution, TransactionClassification } from "@/lib/types";

interface Props {
  data: ClassificationDistribution;
}

export function ClassificationChart({ data }: Props) {
  const entries = (Object.keys(data) as TransactionClassification[])
    .filter((k) => data[k] > 0)
    .sort((a, b) => data[b] - data[a]);

  const total = entries.reduce((s, k) => s + data[k], 0);

  const chartData = entries.map((k) => ({
    name: CLASSIFICATION_LABELS[k],
    value: data[k],
    color: CLASSIFICATION_COLORS[k],
  }));

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold">Classification Distribution</h3>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [
                  `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
                  "",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold">{total.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
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
