"use client";

import { useState, useRef } from "react";
import { Loader2, Search, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExampleChips } from "./ExampleChips";

interface InputPanelProps {
  onAnalyzeTx: (fixtureJson: string) => void;
  onAnalyzeFixture: (name: string) => void;
  onAnalyzeBlock: (blk: File, rev: File, xor: File) => void;
  loading: boolean;
}

export function InputPanel({ onAnalyzeTx, onAnalyzeFixture, onAnalyzeBlock, loading }: InputPanelProps) {
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
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="tx">
          <TabsList className="mb-4">
            <TabsTrigger value="tx">Transaction</TabsTrigger>
            <TabsTrigger value="block">Block</TabsTrigger>
          </TabsList>

          <TabsContent value="tx" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fixture-input">Fixture JSON</Label>
              <Textarea
                id="fixture-input"
                placeholder='{"network":"mainnet","raw_tx":"0200...","prevouts":[...]}'
                className="min-h-[180px] font-mono text-xs resize-y"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
            </div>

            <ExampleChips onSelect={loadAndAnalyze} disabled={loading} />

            <Button
              onClick={handleTxSubmit}
              disabled={loading || !input.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Transaction
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="block" className="space-y-4">
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

            <Button
              onClick={handleBlockSubmit}
              disabled={loading || !allBlockFiles}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Block…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze Block
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
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
