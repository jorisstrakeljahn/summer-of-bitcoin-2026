"use client";

import { useState } from "react";
import type { TransactionReport, BlockReport, BlockSummary } from "@/lib/types";
import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { TransactionResult } from "@/components/TransactionResult";
import { BlockSummaryList } from "@/components/BlockSummaryList";
import { BlockResult } from "@/components/BlockResult";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type AppState =
  | { mode: "idle" }
  | { mode: "loading" }
  | { mode: "tx-result"; report: TransactionReport }
  | { mode: "block-list"; session: string; blocks: BlockSummary[] }
  | { mode: "block-detail"; session: string; blocks: BlockSummary[]; report: BlockReport }
  | { mode: "block-loading"; session: string; blocks: BlockSummary[] }
  | { mode: "error"; error: { code: string; message: string } };

export default function Home() {
  const [state, setState] = useState<AppState>({ mode: "idle" });

  async function handleAnalyzeFixture(name: string) {
    setState({ mode: "loading" });
    try {
      const res = await fetch(`/api/analyze-fixture?name=${encodeURIComponent(name)}`);
      const result = await res.json();
      if (result.ok) {
        setState({ mode: "tx-result", report: result as TransactionReport });
      } else {
        setState({ mode: "error", error: result.error });
      }
    } catch {
      setState({ mode: "error", error: { code: "CLIENT_ERROR", message: "Failed to load fixture" } });
    }
  }

  async function handleAnalyzeTx(fixtureJson: string) {
    setState({ mode: "loading" });
    try {
      const body = JSON.parse(fixtureJson);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.ok) {
        setState({ mode: "tx-result", report: result as TransactionReport });
      } else {
        setState({ mode: "error", error: result.error });
      }
    } catch {
      setState({ mode: "error", error: { code: "CLIENT_ERROR", message: "Invalid JSON input" } });
    }
  }

  async function handleAnalyzeBlock(blk: File, rev: File, xor: File) {
    setState({ mode: "loading" });
    try {
      const formData = new FormData();
      formData.append("blk", blk);
      formData.append("rev", rev);
      formData.append("xor", xor);

      const res = await fetch("/api/analyze-block", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.ok) {
        setState({
          mode: "block-list",
          session: result.session,
          blocks: result.blocks as BlockSummary[],
        });
      } else {
        setState({ mode: "error", error: result.error });
      }
    } catch {
      setState({ mode: "error", error: { code: "CLIENT_ERROR", message: "Failed to upload block files" } });
    }
  }

  async function handleLoadBlock(session: string, blocks: BlockSummary[], hash: string) {
    setState({ mode: "block-loading", session, blocks });
    try {
      const res = await fetch(`/api/block-report?session=${encodeURIComponent(session)}&hash=${encodeURIComponent(hash)}`);
      const result = await res.json();
      if (result.ok !== false) {
        setState({ mode: "block-detail", session, blocks, report: result as BlockReport });
      } else {
        setState({ mode: "error", error: result.error });
      }
    } catch {
      setState({ mode: "error", error: { code: "CLIENT_ERROR", message: "Failed to load block report" } });
    }
  }

  const isLoading = state.mode === "loading" || state.mode === "block-loading";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <InputPanel
          onAnalyzeTx={handleAnalyzeTx}
          onAnalyzeFixture={handleAnalyzeFixture}
          onAnalyzeBlock={handleAnalyzeBlock}
          loading={isLoading}
        />

        {state.mode === "tx-result" && <TransactionResult report={state.report} />}

        {state.mode === "block-list" && (
          <BlockSummaryList
            blocks={state.blocks}
            onSelectBlock={(hash) => handleLoadBlock(state.session, state.blocks, hash)}
          />
        )}

        {state.mode === "block-loading" && (
          <>
            <BlockSummaryList
              blocks={state.blocks}
              onSelectBlock={() => {}}
              disabled
            />
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              Loading block details…
            </div>
          </>
        )}

        {state.mode === "block-detail" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setState({ mode: "block-list", session: state.session, blocks: state.blocks })}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to block list
            </Button>
            <BlockResult report={state.report} />
          </>
        )}

        {state.mode === "error" && <ErrorDisplay error={state.error} />}
      </main>
    </div>
  );
}
