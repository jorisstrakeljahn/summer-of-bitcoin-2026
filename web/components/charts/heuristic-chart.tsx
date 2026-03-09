"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { HEURISTIC_COLORS, HEURISTIC_LABELS } from "@/lib/constants";
import type { HeuristicId } from "@/lib/types";

interface Props {
  detections: Record<string, number>;
}

export function HeuristicChart({ detections }: Props) {
  const chartData = Object.entries(detections)
    .sort(([, a], [, b]) => b - a)
    .map(([id, count]) => ({
      id,
      name: HEURISTIC_LABELS[id as HeuristicId] ?? id,
      count,
      color: HEURISTIC_COLORS[id as HeuristicId] ?? "#6b7280",
    }));

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold">Heuristic Detections</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [
                value.toLocaleString(),
                "Detections",
              ]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
