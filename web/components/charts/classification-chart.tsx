/**
 * Pie chart showing the distribution of transaction classifications in a block.
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
import { CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from "@/lib/constants";
import { InfoButton } from "@/components/info-panel";
import { INFO } from "@/lib/info-content";
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
    <div className="rounded-xl bg-card p-5">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-sm font-semibold">Classification Distribution</h3>
        <InfoButton title={INFO.classificationDistribution.title}>
          {INFO.classificationDistribution.body}
        </InfoButton>
      </div>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative h-36 w-36 shrink-0 sm:h-48 sm:w-48">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold">{total.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
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
