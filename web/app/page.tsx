"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { FixtureInput } from "@/components/fixture-input";
import { TransactionSummary } from "@/components/transaction-summary";
import { WarningsDisplay } from "@/components/warnings-display";
import { InputsTable } from "@/components/inputs-table";
import { OutputsTable } from "@/components/outputs-table";
import { RbfLocktimeInfo } from "@/components/rbf-locktime-info";
import { PsbtViewer } from "@/components/psbt-viewer";
import type { BuildResult } from "@/lib/core";

export default function Home() {
  const [fixture, setFixture] = useState("");
  const [result, setResult] = useState<BuildResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuild() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      JSON.parse(fixture);
    } catch {
      setError("Invalid JSON — please check your fixture syntax.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: fixture,
      });
      const data: BuildResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const report = result?.ok === true ? result : null;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            <span className="text-primary">Coin</span> Smith
          </h1>
          <p className="text-sm text-muted-foreground">
            Build safe, unsigned Bitcoin transactions — select coins, estimate fees, and export a PSBT.
          </p>
        </header>

        <Separator />

        <FixtureInput
          value={fixture}
          onChange={setFixture}
          onBuild={handleBuild}
          loading={loading}
        />

        {error && (
          <div className="border border-destructive/50 rounded-lg p-3 text-sm text-destructive bg-destructive/10">
            {error}
          </div>
        )}

        {result && !result.ok && (
          <div className="border border-destructive/50 rounded-lg p-3 space-y-1 bg-destructive/10">
            <p className="text-sm font-medium text-destructive">Build failed</p>
            <p className="text-xs text-muted-foreground font-mono">
              {result.error.code}: {result.error.message}
            </p>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            <Separator />
            <TransactionSummary report={report} />
            <WarningsDisplay warnings={report.warnings} />
            <InputsTable inputs={report.selected_inputs} />
            <OutputsTable outputs={report.outputs} changeIndex={report.change_index} />
            <RbfLocktimeInfo report={report} />
            <PsbtViewer base64={report.psbt_base64} />
          </div>
        )}
      </div>
    </main>
  );
}
