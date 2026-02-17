"use client";

import type { TransactionReport } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Repeat } from "lucide-react";

interface SummaryBarProps {
  report: TransactionReport;
}

function truncateTxid(txid: string): string {
  return `${txid.slice(0, 8)}…${txid.slice(-8)}`;
}

export function SummaryBar({ report }: SummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-card px-4 py-2.5 text-xs">
      {/* TXID */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
            {truncateTxid(report.txid)}
            <CopyButton text={report.txid} />
          </span>
        </TooltipTrigger>
        <TooltipContent>Transaction ID — unique identifier</TooltipContent>
      </Tooltip>

      <Sep />

      {/* Fee */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="tabular-nums">
            <span className="text-primary font-medium">{report.fee_sats.toLocaleString()} sat</span>
            <span className="text-muted-foreground ml-1">({report.fee_rate_sat_vb} sat/vB)</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>Fee: the amount paid to miners for including this transaction</TooltipContent>
      </Tooltip>

      <Sep />

      {/* Size */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="tabular-nums text-muted-foreground">
            {report.vbytes} vB · {report.weight} WU
          </span>
        </TooltipTrigger>
        <TooltipContent>Virtual size (vBytes) and weight units determine block space usage</TooltipContent>
      </Tooltip>

      <Sep />

      {/* Format */}
      {report.segwit ? (
        <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">SegWit</Badge>
      ) : (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Legacy</Badge>
      )}

      {/* I/O Count */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="tabular-nums text-muted-foreground">
            {report.vin.length}→{report.vout.length}
          </span>
        </TooltipTrigger>
        <TooltipContent>{report.vin.length} inputs → {report.vout.length} outputs</TooltipContent>
      </Tooltip>

      {/* RBF */}
      {report.rbf_signaling && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-blue-900/40 text-blue-300 text-[10px] px-1.5 py-0">
              <Repeat className="h-2.5 w-2.5 mr-0.5" />RBF
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Replace-By-Fee: sender can bump the fee before confirmation</TooltipContent>
        </Tooltip>
      )}

      {/* SegWit Savings */}
      {report.segwit_savings && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-primary font-medium">
              −{report.segwit_savings.savings_pct}%
            </span>
          </TooltipTrigger>
          <TooltipContent>SegWit discount: {report.segwit_savings.savings_pct}% less weight compared to legacy</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function Sep() {
  return <span className="text-muted-foreground/30 select-none">·</span>;
}
