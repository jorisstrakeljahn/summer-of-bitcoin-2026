"use client";

import { useState, useCallback } from "react";
import type { TransactionReport } from "@/lib/types";
import type { SelectedNode } from "./TransactionFlow";
import { SummaryBar } from "./SummaryBar";
import { TransactionFlow } from "./TransactionFlow";
import { NodeDetailSheet } from "./NodeDetailSheet";
import { TechnicalDetails } from "./TechnicalDetails";

interface TransactionResultProps {
  report: TransactionReport;
}

function selectionToNodeId(sel: SelectedNode | null): string | null {
  if (!sel) return null;
  switch (sel.type) {
    case "input": return `in-${sel.index}`;
    case "output": return `out-${sel.index}`;
    case "tx": return "tx";
    case "fee": return "fee";
  }
}

export function TransactionResult({ report }: TransactionResultProps) {
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNodeSelect = useCallback((sel: SelectedNode | null) => {
    if (sel === null) {
      setSelected(null);
      setSheetOpen(false);
    } else {
      setSelected(sel);
      setSheetOpen(true);
    }
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
  }, []);

  return (
    <div className="space-y-4">
      <SummaryBar report={report} />

      <TransactionFlow
        report={report}
        onNodeSelect={handleNodeSelect}
        selectedNodeId={selectionToNodeId(selected)}
      />

      <p className="text-xs text-muted-foreground text-center">
        Click a node to explore · Drag to rearrange · Scroll to zoom
      </p>

      <TechnicalDetails report={report} />

      <NodeDetailSheet
        report={report}
        selected={selected}
        open={sheetOpen}
        onClose={handleSheetClose}
      />
    </div>
  );
}
