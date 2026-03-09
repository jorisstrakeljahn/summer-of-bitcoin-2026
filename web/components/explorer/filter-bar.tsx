"use client";

import { Search } from "lucide-react";
import { CLASSIFICATION_LABELS, HEURISTIC_LABELS } from "@/lib/constants";
import type { TransactionClassification, HeuristicId } from "@/lib/types";

interface Props {
  classificationFilter: string;
  heuristicFilter: string;
  search: string;
  onClassificationChange: (val: string) => void;
  onHeuristicChange: (val: string) => void;
  onSearchChange: (val: string) => void;
}

const CLASSIFICATIONS = Object.keys(CLASSIFICATION_LABELS) as TransactionClassification[];
const HEURISTICS = Object.keys(HEURISTIC_LABELS) as HeuristicId[];

export function FilterBar({
  classificationFilter,
  heuristicFilter,
  search,
  onClassificationChange,
  onHeuristicChange,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={classificationFilter}
        onChange={(e) => onClassificationChange(e.target.value)}
        className="rounded-md border bg-card px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">All Classifications</option>
        {CLASSIFICATIONS.map((c) => (
          <option key={c} value={c}>
            {CLASSIFICATION_LABELS[c]}
          </option>
        ))}
      </select>

      <select
        value={heuristicFilter}
        onChange={(e) => onHeuristicChange(e.target.value)}
        className="rounded-md border bg-card px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">All Heuristics</option>
        {HEURISTICS.map((h) => (
          <option key={h} value={h}>
            {HEURISTIC_LABELS[h]}
          </option>
        ))}
      </select>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by TXID (min 4 chars)..."
          className="w-full rounded-md border bg-card py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}
