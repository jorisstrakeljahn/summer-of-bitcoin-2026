"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ClassificationChart } from "@/components/charts/classification-chart";
import { FeeRateChart } from "@/components/charts/fee-rate-chart";
import { HeuristicChart } from "@/components/charts/heuristic-chart";
import { ScriptTypeChart } from "@/components/charts/script-type-chart";
import { TransactionExplorer } from "@/components/explorer/transaction-explorer";
import { useFiles, useAnalysis, useStats } from "@/lib/hooks/use-analysis";

export default function Dashboard() {
  const { files } = useFiles();
  const [activeStem, setActiveStem] = useState<string | null>(null);
  const [activeBlockIdx, setActiveBlockIdx] = useState<number | null>(null);

  useEffect(() => {
    if (files.length > 0 && !activeStem) {
      setActiveStem(files[0].stem);
    }
  }, [files, activeStem]);

  const { data: analysis, loading: analysisLoading } = useAnalysis(activeStem);
  const { stats } = useStats(activeStem);

  const handleStemChange = (stem: string) => {
    setActiveStem(stem);
    setActiveBlockIdx(null);
  };

  const activeBlock =
    activeBlockIdx !== null ? (analysis?.blocks[activeBlockIdx] ?? null) : null;

  const summary = activeBlock
    ? {
        total_tx: activeBlock.tx_count,
        flagged: activeBlock.flagged,
        fee_rate: activeBlock.fee_rate_stats,
        height: activeBlock.block_height,
      }
    : analysis
      ? {
          total_tx: analysis.summary.total_transactions_analyzed,
          flagged: analysis.summary.flagged_transactions,
          fee_rate: analysis.summary.fee_rate_stats,
          height: null,
        }
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        files={files}
        activeStem={activeStem}
        onStemChange={handleStemChange}
      />

      <div className="flex flex-1">
        <Sidebar
          blocks={analysis?.blocks ?? []}
          activeBlockIdx={activeBlockIdx}
          onBlockSelect={setActiveBlockIdx}
          loading={analysisLoading}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            {analysisLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {summary && !analysisLoading && (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <StatCard
                    label="Total Transactions"
                    value={summary.total_tx.toLocaleString()}
                  />
                  <StatCard
                    label="Flagged"
                    value={summary.flagged.toLocaleString()}
                    subtitle={`${((summary.flagged / summary.total_tx) * 100).toFixed(1)}%`}
                  />
                  <StatCard
                    label="Median Fee Rate"
                    value={`${summary.fee_rate.median_sat_vb}`}
                    subtitle="sat/vB"
                  />
                  <StatCard
                    label={summary.height ? "Block Height" : "Blocks"}
                    value={
                      summary.height
                        ? `#${summary.height.toLocaleString()}`
                        : `${analysis?.block_count ?? 0}`
                    }
                  />
                </div>

                {stats && activeBlockIdx === null && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <ClassificationChart
                        data={stats.classification_distribution}
                      />
                      <FeeRateChart
                        histogram={stats.fee_rate_histogram}
                        stats={analysis?.summary.fee_rate_stats}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <HeuristicChart detections={stats.heuristic_detections} />
                      <ScriptTypeChart
                        distribution={stats.script_type_distribution}
                      />
                    </div>
                  </>
                )}

                {activeBlockIdx !== null && activeBlock && activeStem && (
                  <>
                    <div className="rounded-xl border bg-card p-5">
                      <h3 className="text-sm font-semibold">
                        Block #{activeBlock.block_height.toLocaleString()}
                      </h3>
                      <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                        {activeBlock.block_hash}
                      </p>
                    </div>
                    <TransactionExplorer
                      stem={activeStem}
                      blockIdx={activeBlockIdx}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/30">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
