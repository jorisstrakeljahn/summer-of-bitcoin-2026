"use client";

import { useState, useEffect } from "react";
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
import { InfoButton } from "@/components/info-panel";
import { INFO } from "@/lib/info-content";
import type { HeuristicId } from "@/lib/types";

const SHORT_LABELS: Record<string, string> = {
  cioh: "CIOH",
  change_detection: "Change Det.",
  address_reuse: "Addr Reuse",
  coinjoin: "CoinJoin",
  consolidation: "Consolid.",
  self_transfer: "Self Xfer",
  round_number_payment: "Round Num.",
  op_return: "OP_RETURN",
  peeling_chain: "Peeling",
};

interface Props {
  detections: Record<string, number>;
}

export function HeuristicChart({ detections }: Props) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setCompact(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCompact(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const chartData = Object.entries(detections)
    .sort(([, a], [, b]) => b - a)
    .map(([id, count]) => ({
      id,
      name: compact
        ? (SHORT_LABELS[id] ?? id)
        : (HEURISTIC_LABELS[id as HeuristicId] ?? id),
      count,
      color: HEURISTIC_COLORS[id as HeuristicId] ?? "#6b7280",
    }));

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-sm font-semibold">Heuristic Detections</h3>
        <InfoButton title={INFO.heuristicDetections.title}>
          {INFO.heuristicDetections.body}
        </InfoButton>
      </div>
      <div className="mt-4 h-48 sm:h-56">
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
              width={compact ? 75 : 110}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
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
