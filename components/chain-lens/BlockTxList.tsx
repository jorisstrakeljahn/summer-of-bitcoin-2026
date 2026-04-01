"use client";

import type { BlockReport } from "@/lib/chain-lens/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TransactionResult } from "./TransactionResult";
import { ScriptBadge } from "./ScriptBadge";

interface BlockTxListProps {
  report: BlockReport;
}

export function BlockTxList({ report }: BlockTxListProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Transactions ({report.tx_count})
      </p>
      <Accordion type="single" collapsible>
        {report.transactions.map((tx, i) => (
          <AccordionItem key={tx.txid} value={tx.txid}>
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <span className="text-xs text-muted-foreground">#{i}</span>
                <span className="font-mono text-xs">
                  {tx.txid.slice(0, 12)}…
                </span>
                {i === 0 && <ScriptBadge type="coinbase" />}
                <span className="text-xs text-muted-foreground">
                  {tx.fee_sats.toLocaleString()} sat fee
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <TransactionResult report={tx} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
