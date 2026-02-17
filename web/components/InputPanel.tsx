"use client";

import { useState, useRef } from "react";
import { Search, Upload, X, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExampleChips } from "./ExampleChips";
import { AnalysisProgress } from "./AnalysisProgress";

interface InputPanelProps {
  onAnalyzeTx: (fixtureJson: string) => void;
  onAnalyzeFixture: (name: string) => void;
  onAnalyzeBlock: (blk: File, rev: File, xor: File) => void;
  loading: boolean;
  loadingType?: "tx" | "block" | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function InputPanel({
  onAnalyzeTx, onAnalyzeFixture, onAnalyzeBlock,
  loading, loadingType,
  collapsed = false, onToggleCollapse,
}: InputPanelProps) {
  const [tab, setTab] = useState<"tx" | "block">("tx");
  const [input, setInput] = useState("");
  const [blkFile, setBlkFile] = useState<File | null>(null);
  const [revFile, setRevFile] = useState<File | null>(null);
  const [xorFile, setXorFile] = useState<File | null>(null);
  const blkRef = useRef<HTMLInputElement>(null);
  const revRef = useRef<HTMLInputElement>(null);
  const xorRef = useRef<HTMLInputElement>(null);

  function loadAndAnalyze(file: string) {
    onAnalyzeFixture(file);
  }

  function handleTxSubmit() {
    if (!input.trim()) return;
    onAnalyzeTx(input.trim());
  }

  function handleBlockSubmit() {
    if (!blkFile || !revFile || !xorFile) return;
    onAnalyzeBlock(blkFile, revFile, xorFile);
  }

  const allBlockFiles = blkFile && revFile && xorFile;

  return (
    <Card className="py-0 gap-0">
      {/* Collapsible Header */}
      <button
        onClick={onToggleCollapse}
        className="flex w-full items-center justify-between px-5 py-2.5 text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium">
            {tab === "tx" ? "Transaction Analysis" : "Block Analysis"}
          </h2>
          <div className="flex gap-1">
            <span
              onClick={(e) => { e.stopPropagation(); setTab("tx"); }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-all ${
                tab === "tx"
                  ? "border-2 border-primary text-primary bg-primary/5"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              Transaction
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setTab("block"); }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-all ${
                tab === "block"
                  ? "border-2 border-primary text-primary bg-primary/5"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              Block
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          collapsed ? "max-h-0 opacity-0" : "max-h-[800px] opacity-100"
        }`}
      >
        <CardContent className="pt-0 pb-3 px-5">
          {/* Transaction Tab */}
          {tab === "tx" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="fixture-input">Fixture JSON</Label>
                <Textarea
                  id="fixture-input"
                  placeholder='{"network":"mainnet","raw_tx":"0200...","prevouts":[...]}'
                  className="min-h-[140px] font-mono text-xs resize-y"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
              </div>

              <ExampleChips onSelect={loadAndAnalyze} disabled={loading} />

              <AnalysisProgress
                active={loading && loadingType === "tx"}
                label="Analyzing transaction…"
                estimatedMs={3000}
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleTxSubmit}
                  disabled={loading || !input.trim()}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                <Search className="mr-1.5 h-3.5 w-3.5" />
                Analyze Transaction
                </Button>
              </div>
            </div>
          )}

          {/* Block Tab */}
          {tab === "block" && (
          <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Upload the three block data files from Bitcoin Core to analyze full blocks.
              </p>

              <FileUploadField
                label="blk*.dat"
                file={blkFile}
                inputRef={blkRef}
                onFile={setBlkFile}
                disabled={loading}
              />
              <FileUploadField
                label="rev*.dat"
                file={revFile}
                inputRef={revRef}
                onFile={setRevFile}
                disabled={loading}
              />
              <FileUploadField
                label="xor.dat"
                file={xorFile}
                inputRef={xorRef}
                onFile={setXorFile}
                disabled={loading}
              />

              <AnalysisProgress
                active={loading && loadingType === "block"}
                label="Analyzing blocks…"
                estimatedMs={12000}
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleBlockSubmit}
                  disabled={loading || !allBlockFiles}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Analyze Block
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

interface FileUploadFieldProps {
  label: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File | null) => void;
  disabled: boolean;
}

function FileUploadField({ label, file, inputRef, onFile, disabled }: FileUploadFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".dat"
          className="hidden"
          disabled={disabled}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <Button
          variant="outline"
          size="sm"
          className="flex-1 justify-start font-mono text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {file ? (
            <span className="truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          ) : (
            <span className="text-muted-foreground">Choose file…</span>
          )}
        </Button>
        {file && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              onFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            disabled={disabled}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
