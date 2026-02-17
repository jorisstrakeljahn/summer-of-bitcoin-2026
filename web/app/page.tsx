"use client";

import { useState } from "react";
import type { TransactionReport, BlockReport } from "@/lib/types";
import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { TransactionResult } from "@/components/TransactionResult";
import { BlockResult } from "@/components/BlockResult";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppState =
  | { mode: "idle" }
  | { mode: "loading" }
  | { mode: "tx-result"; report: TransactionReport }
  | { mode: "block-result"; blocks: BlockReport[] }
  | { mode: "error"; error: { code: string; message: string } };

export default function Home() {
  const [state, setState] = useState<AppState>({ mode: "idle" });

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
      setState({
        mode: "error",
        error: { code: "CLIENT_ERROR", message: "Invalid JSON input" },
      });
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
        setState({ mode: "block-result", blocks: result.blocks as BlockReport[] });
      } else {
        setState({ mode: "error", error: result.error });
      }
    } catch {
      setState({
        mode: "error",
        error: { code: "CLIENT_ERROR", message: "Failed to upload block files" },
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <InputPanel
          onAnalyzeTx={handleAnalyzeTx}
          onAnalyzeBlock={handleAnalyzeBlock}
          loading={state.mode === "loading"}
        />

        {state.mode === "tx-result" && <TransactionResult report={state.report} />}

        {state.mode === "block-result" && (
          <BlockResultView blocks={state.blocks} />
        )}

        {state.mode === "error" && <ErrorDisplay error={state.error} />}
      </main>
    </div>
  );
}

function BlockResultView({ blocks }: { blocks: BlockReport[] }) {
  if (blocks.length === 1) {
    return <BlockResult report={blocks[0]} />;
  }

  return (
    <Tabs defaultValue={blocks[0]?.block_header.block_hash}>
      <TabsList className="mb-4 flex-wrap h-auto gap-1">
        {blocks.map((b, i) => (
          <TabsTrigger key={b.block_header.block_hash} value={b.block_header.block_hash} className="text-xs font-mono">
            Block #{i} ({b.block_header.block_hash.slice(0, 8)}…)
          </TabsTrigger>
        ))}
      </TabsList>
      {blocks.map((b) => (
        <TabsContent key={b.block_header.block_hash} value={b.block_header.block_hash}>
          <BlockResult report={b} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
