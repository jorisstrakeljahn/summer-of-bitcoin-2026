/**
 * Badge component that displays a transaction classification with a colored label.
 */
"use client";

import { CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from "@/lib/sherlock/constants";
import type { TransactionClassification } from "@/lib/sherlock/types";

interface Props {
  classification: TransactionClassification;
}

export function ClassificationBadge({ classification }: Props) {
  const color = CLASSIFICATION_COLORS[classification] ?? "#6b7280";
  const label = CLASSIFICATION_LABELS[classification] ?? classification;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
