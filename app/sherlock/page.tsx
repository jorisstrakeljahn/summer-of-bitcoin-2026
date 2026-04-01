"use client";

import { useState, useEffect } from "react";
import { Activity, AlertTriangle, Gauge, Layers, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { INFO } from "@/lib/sherlock/info-content";
import { Header } from "@/components/sherlock/layout/header";
import { StatCard } from "@/components/sherlock/stat-card";
import { Spinner } from "@/components/sherlock/spinner";
import { Sidebar } from "@/components/sherlock/layout/sidebar";
import { ClassificationChart } from "@/components/sherlock/charts/classification-chart";
import { FeeRateChart } from "@/components/sherlock/charts/fee-rate-chart";
import { HeuristicChart } from "@/components/sherlock/charts/heuristic-chart";
import { ScriptTypeChart } from "@/components/sherlock/charts/script-type-chart";
import { TransactionExplorer } from "@/components/sherlock/explorer/transaction-explorer";
import { FlowModal } from "@/components/sherlock/flow/flow-modal";
import { BlockMosaic } from "@/components/sherlock/mosaic/block-mosaic";
import { UploadModal } from "@/components/sherlock/upload/upload-modal";
import { useFiles, useAnalysis, useStats } from "@/lib/sherlock/hooks/use-analysis";
import { formatTimestamp } from "@/lib/sherlock/utils";

export default function SherlockPage() {
  const { files, refetch: refetchFiles } = useFiles();
  const [activeStem, setActiveStem] = useState<string | null>(null);
  const [activeBlockIdx, setActiveBlockIdx] = useState<number | null>(null);
  const [flowTxid, setFlowTxid] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    if (files.length > 0 && !activeStem) {
      setActiveStem(files[0].stem);
    }
  }, [files, activeStem]);

  const { data: analysis, loading: analysisLoading, error: analysisError } = useAnalysis(activeStem);
  const { stats, error: statsError } = useStats(activeStem);

  const handleStemChange = (stem: string) => {
    setActiveStem(stem);
    setActiveBlockIdx(null);
  };

  const handleUploadSuccess = (stem: string) => {
    setUploadOpen(false);
    refetchFiles();
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
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg bg-card/80 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>
      <Header
        files={files}
        activeStem={activeStem}
        onStemChange={handleStemChange}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        onUploadClick={() => setUploadOpen(true)}
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

        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
            {analysisLoading && (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            )}

            {(analysisError || statsError) && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Failed to load analysis data. Please try again.
              </div>
            )}

            {summary && !analysisLoading && (
              <>
                {activeBlock && (
                  <div className="rounded-xl bg-card p-5">
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
                      <ClassificationChart data={stats.classification_distribution} />
                      <FeeRateChart
                        histogram={stats.fee_rate_histogram}
                        stats={analysis?.summary.fee_rate_stats}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <HeuristicChart detections={stats.heuristic_detections} />
                      <ScriptTypeChart distribution={stats.script_type_distribution} />
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

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
