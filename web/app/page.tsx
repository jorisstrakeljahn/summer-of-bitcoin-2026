/**
 * Main dashboard page for Bitcoin chain analysis: stats, charts, block mosaic, and transaction explorer.
 */
"use client";

import { useState, useEffect } from "react";
import { Activity, AlertTriangle, Gauge, Layers } from "lucide-react";
import { INFO } from "@/lib/info-content";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/stat-card";
import { Spinner } from "@/components/spinner";
import { Sidebar } from "@/components/layout/sidebar";
import { ClassificationChart } from "@/components/charts/classification-chart";
import { FeeRateChart } from "@/components/charts/fee-rate-chart";
import { HeuristicChart } from "@/components/charts/heuristic-chart";
import { ScriptTypeChart } from "@/components/charts/script-type-chart";
import { TransactionExplorer } from "@/components/explorer/transaction-explorer";
import { FlowModal } from "@/components/flow/flow-modal";
import { BlockMosaic } from "@/components/mosaic/block-mosaic";
import { useFiles, useAnalysis, useStats } from "@/lib/hooks/use-analysis";
import { formatTimestamp } from "@/lib/utils";

export default function Dashboard() {
  const { files } = useFiles();
  const [activeStem, setActiveStem] = useState<string | null>(null);
  const [activeBlockIdx, setActiveBlockIdx] = useState<number | null>(null);
  const [flowTxid, setFlowTxid] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
      />

      <div className="flex flex-1">
        <Sidebar
          blocks={analysis?.blocks ?? []}
          activeBlockIdx={activeBlockIdx}
          onBlockSelect={setActiveBlockIdx}
          loading={analysisLoading}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
            {analysisLoading && (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            )}

            {summary && !analysisLoading && (
              <>
                {activeBlock && (
                  <div className="rounded-lg border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">
                        Block #{activeBlock.block_height.toLocaleString()}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activeBlock.block_timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {activeBlock.block_hash}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
                  <StatCard
                    icon={<Activity className="h-4 w-4 text-primary" />}
                    label="Total Transactions"
                    value={summary.total_tx.toLocaleString()}
                    info={INFO.totalTransactions}
                  />
                  <StatCard
                    icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                    label="Flagged"
                    value={summary.flagged.toLocaleString()}
                    subtitle={`${((summary.flagged / summary.total_tx) * 100).toFixed(1)}%`}
                    info={INFO.flaggedTransactions}
                  />
                  <StatCard
                    icon={<Gauge className="h-4 w-4 text-cyan-500" />}
                    label="Median Fee Rate"
                    value={`${summary.fee_rate.median_sat_vb}`}
                    subtitle="sat/vB"
                    info={INFO.medianFeeRate}
                  />
                  <StatCard
                    icon={<Layers className="h-4 w-4 text-purple-500" />}
                    label={summary.height ? "Block Height" : "Blocks"}
                    value={
                      summary.height
                        ? `#${summary.height.toLocaleString()}`
                        : `${analysis?.block_count ?? 0}`
                    }
                    info={INFO.blockCount}
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

                {activeBlockIdx !== null && activeStem && (
                  <>
                    <BlockMosaic
                      stem={activeStem}
                      blockIdx={activeBlockIdx}
                      onTxClick={(txid) => setFlowTxid(txid)}
                    />
                    <TransactionExplorer
                      stem={activeStem}
                      blockIdx={activeBlockIdx}
                      onViewGraph={(txid) => setFlowTxid(txid)}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {flowTxid && activeStem && (
        <FlowModal
          stem={activeStem}
          txid={flowTxid}
          onClose={() => setFlowTxid(null)}
        />
      )}
    </div>
  );
}
