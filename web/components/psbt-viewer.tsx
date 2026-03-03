/**
 * PSBT viewer with decoded and raw base64 views.
 *
 * Fetches the decoded PSBT structure from /api/psbt-decode and
 * renders it as an interactive card grid. Users can toggle between
 * the decoded field-level view and the raw base64 string.
 *
 * Sub-components:
 *   FieldLabel   — Label with optional tooltip (BIP field docs)
 *   InputCard    — Single decoded PSBT input
 *   OutputCard   — Single decoded PSBT output
 *   DecodedView  — Full decoded PSBT layout
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProgressiveList } from "@/hooks/use-progressive-list";
import type { DecodedPsbt, DecodedInput, DecodedOutput } from "@/lib/types";

// ── Constants ──────────────────────────────────────────────────────

interface PsbtViewerProps {
  base64: string;
}

const FIELD_TOOLTIPS: Record<string, string> = {
  version: "Transaction version. Version 2 enables relative timelocks (BIP-68).",
  locktime: "nLockTime — the earliest block height or unix timestamp at which this TX can be mined.",
  sequence: "nSequence — controls RBF signaling and relative timelocks. 0xFFFFFFFD enables RBF.",
  witnessUtxo: "The previous output being spent, containing value and scriptPubKey. Required for SegWit signing.",
  script: "The scriptPubKey defining the spending conditions for this output.",
  value: "Amount in satoshis.",
};

// ── Helpers ────────────────────────────────────────────────────────

function truncateHex(hex: string, len = 16): string {
  if (hex.length <= len) return hex;
  const half = Math.floor((len - 1) / 2);
  return `${hex.slice(0, half)}…${hex.slice(-half)}`;
}

/** Identifies standard script types by their scriptPubKey pattern. */
function detectScriptType(script: string): string {
  if (script.startsWith("76a914") && script.endsWith("88ac") && script.length === 50) return "P2PKH";
  if (script.startsWith("a914") && script.endsWith("87") && script.length === 46) return "P2SH";
  if (script.startsWith("0014") && script.length === 44) return "P2WPKH";
  if (script.startsWith("0020") && script.length === 68) return "P2WSH";
  if (script.startsWith("5120") && script.length === 68) return "P2TR";
  return "unknown";
}

// ── Sub-components ─────────────────────────────────────────────────

function FieldLabel({ name, tooltip }: { name: string; tooltip?: string }) {
  const tip = tooltip ?? FIELD_TOOLTIPS[name];
  if (!tip) return <span className="text-muted-foreground text-xs">{name}</span>;

  return (
    <Tooltip>
      <TooltipTrigger>
        <span className="text-muted-foreground text-xs border-b border-dotted border-muted-foreground/40 cursor-help">
          {name}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}

function InputCard({ inp }: { inp: DecodedInput }) {
  return (
    <div className="border rounded-md p-3 bg-muted/20 space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs">#{inp.index}</Badge>
        {inp.witnessUtxo && (
          <Badge variant="outline" className="font-mono text-xs">
            {detectScriptType(inp.witnessUtxo.script)}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
        <div>
          <FieldLabel name="txid" tooltip="The transaction ID of the UTXO being spent (in display byte order)." />
          <p className="font-mono text-xs mt-0.5">{truncateHex(inp.txid, 24)}</p>
        </div>
        <div>
          <FieldLabel name="vout" tooltip="Output index within the referenced transaction." />
          <p className="font-mono text-xs mt-0.5">{inp.vout}</p>
        </div>
        <div>
          <FieldLabel name="sequence" />
          <p className="font-mono text-xs mt-0.5">{inp.sequence}</p>
        </div>
        {inp.witnessUtxo && (
          <div>
            <FieldLabel name="witnessUtxo" />
            <p className="font-mono text-xs mt-0.5">
              {inp.witnessUtxo.value.toLocaleString()} sats
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OutputCard({ out }: { out: DecodedOutput }) {
  return (
    <div className="border rounded-md p-3 bg-muted/20 space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs">#{out.index}</Badge>
        <Badge variant="outline" className="font-mono text-xs">
          {detectScriptType(out.script)}
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
        <div>
          <FieldLabel name="value" />
          <p className="font-mono text-xs mt-0.5">{out.value.toLocaleString()} sats</p>
        </div>
        <div>
          <FieldLabel name="script" />
          <p className="font-mono text-xs mt-0.5">{truncateHex(out.script, 24)}</p>
        </div>
      </div>
    </div>
  );
}

function ExpandableCardList<T>({
  items,
  renderItem,
  label,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  label: string;
}) {
  const { visible, remaining, showMore } = useProgressiveList(items, 3);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground font-normal ml-1">({items.length})</span>
      </p>
      <div className="space-y-2">
        {visible.map((item, i) => (
          <div key={i}>{renderItem(item)}</div>
        ))}
      </div>
      {remaining > 0 && (
        <button
          onClick={showMore}
          className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium"
        >
          +{remaining} more — click to expand
        </button>
      )}
    </div>
  );
}

// ── Decoded view ───────────────────────────────────────────────────

function DecodedView({ decoded }: { decoded: DecodedPsbt }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-0.5">
          <FieldLabel name="version" />
          <p className="font-mono text-sm">{decoded.version}</p>
        </div>
        <div className="space-y-0.5">
          <FieldLabel name="locktime" />
          <p className="font-mono text-sm">{decoded.locktime.toLocaleString()}</p>
        </div>
        <div className="space-y-0.5">
          <FieldLabel name="inputs" tooltip="Number of transaction inputs (UTXOs being spent)." />
          <p className="font-mono text-sm">{decoded.inputCount}</p>
        </div>
        <div className="space-y-0.5">
          <FieldLabel name="outputs" tooltip="Number of transaction outputs (payment destinations + change)." />
          <p className="font-mono text-sm">{decoded.outputCount}</p>
        </div>
      </div>

      {decoded.inputs.length > 0 && (
        <ExpandableCardList
          items={decoded.inputs}
          label="Inputs"
          renderItem={(inp) => <InputCard inp={inp} />}
        />
      )}

      {decoded.outputs.length > 0 && (
        <ExpandableCardList
          items={decoded.outputs}
          label="Outputs"
          renderItem={(out) => <OutputCard out={out} />}
        />
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function PsbtViewer({ base64 }: PsbtViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"base64" | "decoded">("decoded");
  const [decoded, setDecoded] = useState<DecodedPsbt | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function decode() {
      try {
        const res = await fetch("/api/psbt-decode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ psbt_base64: base64 }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.error) {
          setDecodeError(data.error);
          setDecoded(null);
        } else {
          setDecoded(data);
          setDecodeError(null);
        }
      } catch {
        if (!cancelled) setDecodeError("Failed to decode PSBT");
      }
    }
    decode();
    return () => { cancelled = true; };
  }, [base64]);

  async function handleCopy() {
    await navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const preview = base64.length > 120 ? base64.slice(0, 120) + "..." : base64;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-medium">PSBT</h2>
          <p className="text-sm text-muted-foreground">
            The unsigned transaction encoded as a Partially Signed Bitcoin Transaction (BIP-174).
          </p>
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      <div className="border rounded-lg p-4 bg-muted/30">
        {view === "base64" ? (
          <Base64View
            base64={base64}
            preview={preview}
            expanded={expanded}
            onToggleExpand={() => setExpanded(!expanded)}
            copied={copied}
            onCopy={handleCopy}
          />
        ) : decoded ? (
          <DecodedView decoded={decoded} />
        ) : decodeError ? (
          <p className="text-sm text-destructive">{decodeError}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Decoding...</p>
        )}
      </div>
    </div>
  );
}

// ── Extracted sub-components ───────────────────────────────────────

function ViewToggle({
  view,
  onViewChange,
}: {
  view: "base64" | "decoded";
  onViewChange: (v: "base64" | "decoded") => void;
}) {
  const options = [
    { key: "decoded" as const, label: "Decoded" },
    { key: "base64" as const, label: "Base64" },
  ];

  return (
    <div className="flex gap-1 border rounded-md p-0.5 bg-muted/30">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onViewChange(opt.key)}
          className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
            view === opt.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Base64View({
  base64,
  preview,
  expanded,
  onToggleExpand,
  copied,
  onCopy,
}: {
  base64: string;
  preview: string;
  expanded: boolean;
  onToggleExpand: () => void;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <>
      <pre className="text-sm font-mono break-all whitespace-pre-wrap text-muted-foreground">
        {expanded ? base64 : preview}
      </pre>
      <div className="flex items-center gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={onCopy} className="cursor-pointer">
          {copied ? "Copied!" : "Copy"}
        </Button>
        {base64.length > 120 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="cursor-pointer"
          >
            {expanded ? "Collapse" : "Show full"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {base64.length} chars
        </span>
      </div>
    </>
  );
}
