"use client";

import { Badge } from "@/components/ui/badge";

const EXAMPLES = [
  { label: "Legacy P2PKH", file: "tx_legacy_p2pkh" },
  { label: "SegWit P2WPKH → P2TR", file: "tx_segwit_p2wpkh_p2tr" },
  { label: "Multi-Input Legacy", file: "tx_multi_input_legacy" },
  { label: "Multi-Input SegWit", file: "multi_input_segwit" },
  { label: "Nested SegWit", file: "segwit_nested_scriptsig_empty_witness_item" },
  { label: "P2SH → P2WSH", file: "tx_legacy_p2sh_p2wsh" },
  { label: "Unordered Prevouts", file: "prevouts_unordered" },
];

interface ExampleChipsProps {
  onSelect: (fixture: string) => void;
  disabled?: boolean;
}

export function ExampleChips({ onSelect, disabled }: ExampleChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-xs text-muted-foreground self-center">Examples:</span>
      {EXAMPLES.map((ex) => (
        <Badge
          key={ex.file}
          variant="outline"
          className="cursor-pointer transition-colors hover:bg-secondary disabled:opacity-50"
          onClick={() => !disabled && onSelect(ex.file)}
        >
          {ex.label}
        </Badge>
      ))}
    </div>
  );
}
