/**
 * Bar chart visualizing fee rate distribution with optional median reference line.
 */
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { InfoButton } from "@/components/info-panel";
import { INFO } from "@/lib/info-content";
import type { FeeRateStats } from "@/lib/types";

interface Props {
  histogram: { range: string; count: number }[];
  stats?: FeeRateStats;
}

export function FeeRateChart({ histogram, stats }: Props) {
  const maxCount = Math.max(...histogram.map((h) => h.count), 1);

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-sm font-semibold">Fee Rate Distribution</h3>
        <InfoButton title={INFO.feeRateDistribution.title}>
          {INFO.feeRateDistribution.body}
        </InfoButton>
      </div>
      {stats && (
        <p className="mt-1 text-xs text-muted-foreground">
          Min: {stats.min_sat_vb} · Median: {stats.median_sat_vb} · Max:{" "}
          {stats.max_sat_vb} sat/vB
        </p>
      )}
      <div className="mt-4 h-40 sm:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram}>
            <XAxis
              dataKey="range"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip
              content={<ChartTooltip />}
              wrapperStyle={{ zIndex: 50 }}
              cursor={{ fill: "var(--accent)", opacity: 0.5 }}
            />
            {stats && (
              <ReferenceLine
                x={getMedianBucket(stats.median_sat_vb)}
                stroke="var(--primary)"
                strokeDasharray="3 3"
                label={{
                  value: "Median",
                  position: "top",
                  fill: "var(--primary)",
                  fontSize: 10,
                }}
              />
            )}
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {histogram.map((_, i) => {
                const ratio = histogram[i].count / maxCount;
                const hue = 160 - ratio * 85;
                return (
                  <rect
                    key={i}
                    fill={`oklch(0.65 0.18 ${hue})`}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function getMedianBucket(median: number): string {
  if (median < 5) return "0-5";
  if (median < 10) return "5-10";
  if (median < 20) return "10-20";
  if (median < 50) return "20-50";
  if (median < 100) return "50-100";
  if (median < 200) return "100-200";
  if (median < 500) return "200-500";
  return "500+";
}
