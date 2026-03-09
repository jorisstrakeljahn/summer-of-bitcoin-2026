"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const SCRIPT_COLORS: Record<string, string> = {
  p2wpkh: "#3b82f6",
  p2tr: "#8b5cf6",
  p2sh: "#f59e0b",
  p2wsh: "#06b6d4",
  p2pkh: "#10b981",
  op_return: "#f43f5e",
  unknown: "#6b7280",
};

const SCRIPT_LABELS: Record<string, string> = {
  p2wpkh: "P2WPKH",
  p2tr: "P2TR",
  p2sh: "P2SH",
  p2wsh: "P2WSH",
  p2pkh: "P2PKH",
  op_return: "OP_RETURN",
  unknown: "Unknown",
};

interface Props {
  distribution: Record<string, number>;
}

export function ScriptTypeChart({ distribution }: Props) {
  const entries = Object.entries(distribution)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const total = entries.reduce((s, [, v]) => s + v, 0);

  const chartData = entries.map(([type, count]) => ({
    name: SCRIPT_LABELS[type] ?? type,
    value: count,
    color: SCRIPT_COLORS[type] ?? "#6b7280",
  }));

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold">Script Type Distribution</h3>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-48 w-48 shrink-0">
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
