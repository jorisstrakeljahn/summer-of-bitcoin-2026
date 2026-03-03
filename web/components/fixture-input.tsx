"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FixtureInputProps {
  value: string;
  onChange: (value: string) => void;
  onBuild: () => void;
  loading: boolean;
}

const EXAMPLES = [
  { file: "basic_change_p2wpkh.json", label: "Basic with change" },
  { file: "send_all_dust_change.json", label: "Send all (no change)" },
  { file: "rbf_with_locktime.json", label: "RBF + Locktime" },
  { file: "mixed_input_types.json", label: "Mixed script types" },
  { file: "many_payments.json", label: "Multiple payments" },
];

export function FixtureInput({ value, onChange, onBuild, loading }: FixtureInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleExampleSelect(filename: string) {
    try {
      const res = await fetch(`/api/fixtures?name=${encodeURIComponent(filename)}`);
      const text = await res.text();
      onChange(text);
    } catch {
      /* ignore */
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onBuild();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-medium text-foreground">Fixture JSON</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Paste a fixture JSON, upload a file, or pick an example below.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Examples</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.file}
              onClick={() => handleExampleSelect(ex.file)}
              className="px-3 py-1.5 text-xs font-mono rounded-md border border-border bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='{"network": "mainnet", "utxos": [...], "payments": [...], ...}'
        className="font-mono text-sm min-h-[120px] max-h-[280px] resize-y overflow-y-auto"
      />
      <div className="flex items-center gap-3">
        <Button
          onClick={onBuild}
          disabled={loading || !value.trim()}
          size="lg"
          className="cursor-pointer"
        >
          {loading ? "Building..." : "Build Transaction"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer"
        >
          Upload File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
        <span className="text-sm text-muted-foreground ml-auto hidden sm:inline">
          Cmd+Enter to build
        </span>
      </div>
    </div>
  );
}
