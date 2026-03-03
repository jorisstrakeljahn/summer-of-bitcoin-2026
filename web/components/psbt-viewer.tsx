"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PsbtViewerProps {
  base64: string;
}

export function PsbtViewer({ base64 }: PsbtViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const preview = base64.length > 120 ? base64.slice(0, 120) + "..." : base64;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">PSBT</h2>
        <p className="text-sm text-muted-foreground">
          The unsigned transaction encoded as a Partially Signed Bitcoin Transaction (BIP-174). Share this with a signer.
        </p>
      </div>
      <div className="border rounded-lg p-4 bg-muted/30">
        <pre className="text-sm font-mono break-all whitespace-pre-wrap text-muted-foreground">
          {expanded ? base64 : preview}
        </pre>
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={handleCopy} className="cursor-pointer">
            {copied ? "Copied!" : "Copy"}
          </Button>
          {base64.length > 120 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="cursor-pointer"
            >
              {expanded ? "Collapse" : "Show full"}
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {base64.length} chars
          </span>
        </div>
      </div>
    </div>
  );
}
