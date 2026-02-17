"use client";

import type { TransactionReport } from "@/lib/types";
import type { SelectedNode } from "./TransactionFlow";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InputDetail } from "./details/InputDetail";
import { OutputDetail } from "./details/OutputDetail";
import { TxDetail } from "./details/TxDetail";
import { FeeDetail } from "./details/FeeDetail";

interface NodeDetailSheetProps {
  report: TransactionReport;
  selected: SelectedNode | null;
  onClose: () => void;
}

function getTitle(selected: SelectedNode): string {
  switch (selected.type) {
    case "input": return `Input #${selected.index}`;
    case "output": return `Output #${selected.index}`;
    case "tx": return "Transaction Summary";
    case "fee": return "Miner Fee";
  }
}

function getDescription(selected: SelectedNode, report: TransactionReport): string {
  switch (selected.type) {
    case "input": {
      const vin = report.vin[selected.index];
      return `${vin.prevout.value_sats.toLocaleString()} sat · ${vin.script_type.toUpperCase()}`;
    }
    case "output": {
      const vout = report.vout[selected.index];
      return `${vout.value_sats.toLocaleString()} sat · ${vout.script_type.toUpperCase()}`;
    }
    case "tx":
      return `${report.vin.length} inputs → ${report.vout.length} outputs`;
    case "fee":
      return `${report.fee_sats.toLocaleString()} sat (${report.fee_rate_sat_vb} sat/vB)`;
  }
}

export function NodeDetailSheet({ report, selected, onClose }: NodeDetailSheetProps) {
  return (
    <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {selected && (
          <>
            <SheetHeader>
              <SheetTitle>{getTitle(selected)}</SheetTitle>
              <SheetDescription>{getDescription(selected, report)}</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4 pb-4">
              {selected.type === "input" && (
                <InputDetail vin={report.vin[selected.index]} index={selected.index} />
              )}
              {selected.type === "output" && (
                <OutputDetail vout={report.vout[selected.index]} />
              )}
              {selected.type === "tx" && (
                <TxDetail report={report} />
              )}
              {selected.type === "fee" && (
                <FeeDetail report={report} />
              )}
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
