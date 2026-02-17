"use client";

import { useState } from "react";
import type { TransactionReport } from "@/lib/types";
import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { TransactionResult } from "@/components/TransactionResult";
import { ErrorDisplay } from "@/components/ErrorDisplay";

type AppState =
  | { mode: "idle" }
  | { mode: "loading" }
  | { mode: "tx-result"; report: TransactionReport }
  | { mode: "error"; error: { code: string; message: string } };

export default function Home() {
  const [state, setState] = useState<AppState>({ mode: "idle" });

  async function handleAnalyze(fixtureJson: string) {
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <InputPanel
          onAnalyze={handleAnalyze}
          loading={state.mode === "loading"}
        />

        {state.mode === "tx-result" && <TransactionResult report={state.report} />}

        {state.mode === "error" && <ErrorDisplay error={state.error} />}
      </main>
    </div>
  );
}
