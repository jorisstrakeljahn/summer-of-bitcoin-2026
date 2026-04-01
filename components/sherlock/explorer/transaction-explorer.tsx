/**
 * Paginated transaction list with filters and optional graph view.
 */
"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "./filter-bar";
import { TransactionRow } from "./transaction-row";
import { useTransactions } from "@/lib/sherlock/hooks/use-analysis";
import { useDebounce } from "@/lib/sherlock/hooks/use-debounce";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { InfoButton } from "@/components/sherlock/info-panel";
import { INFO } from "@/lib/sherlock/info-content";
import { Spinner } from "@/components/sherlock/spinner";

interface Props {
  stem: string;
  blockIdx: number;
  onViewGraph?: (txid: string) => void;
}

export function TransactionExplorer({ stem, blockIdx, onViewGraph }: Props) {
  const [page, setPage] = useState(1);
  const [classificationFilter, setClassificationFilter] = useState("");
  const [heuristicFilter, setHeuristicFilter] = useState("");
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const filters = useMemo(
    () => ({
      classification: classificationFilter || undefined,
      heuristic: heuristicFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    [classificationFilter, heuristicFilter, debouncedSearch],
  );

  const { data, loading, error } = useTransactions(stem, blockIdx, page, filters);

  const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  return (
    <div className="rounded-xl bg-card">
      <div className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="flex-1 text-sm font-semibold">Transaction Explorer</h3>
          <InfoButton title={INFO.transactionExplorer.title}>
            {INFO.transactionExplorer.body}
          </InfoButton>
        </div>
        <div className="mt-3">
          <FilterBar
            classificationFilter={classificationFilter}
            heuristicFilter={heuristicFilter}
            search={search}
            onClassificationChange={handleFilterChange(setClassificationFilter)}
            onHeuristicChange={handleFilterChange(setHeuristicFilter)}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && !loading && (
        <p className="px-4 py-8 text-center text-sm text-destructive">
          Failed to load transactions. Please try again.
        </p>
      )}

      {!loading && !error && data && (
        <>
          <div className="divide-y">
            {data.transactions.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No transactions match the current filters.
              </p>
            )}
            {data.transactions.map((tx) => (
              <TransactionRow
                key={tx.txid}
                tx={tx}
                stem={stem}
                onViewGraph={onViewGraph}
              />
            ))}
          </div>

          {data.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {(data.page - 1) * data.size + 1}–
                {Math.min(data.page * data.size, data.total)} of{" "}
                {data.total.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className="rounded p-2.5 hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium" aria-live="polite">
                  {data.page} / {data.total_pages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.total_pages, p + 1))
                  }
                  disabled={page >= data.total_pages}
                  aria-label="Next page"
                  className="rounded p-2.5 hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
