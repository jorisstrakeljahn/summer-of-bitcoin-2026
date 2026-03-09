"use client";

import { HEURISTIC_COLORS, HEURISTIC_LABELS } from "@/lib/constants";
import type { HeuristicId } from "@/lib/types";

interface Props {
  id: string;
}

export function HeuristicBadge({ id }: Props) {
  const color = HEURISTIC_COLORS[id as HeuristicId] ?? "#6b7280";
  const label = HEURISTIC_LABELS[id as HeuristicId] ?? id;

  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: `${color}18`,
        color,
      }}
    >
      {label}
    </span>
  );
}
