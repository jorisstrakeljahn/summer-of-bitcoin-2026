"use client";

import type { TransactionReport } from "@/lib/chain-lens/types";
import { CopyButton } from "./CopyButton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SummaryBarProps {
  report: TransactionReport;
}

function truncateTxid(txid: string): string {
  return `${txid.slice(0, 8)}…${txid.slice(-8)}`;
}

export function SummaryBar({ report }: SummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-card px-4 py-2.5 text-xs">
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

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="tabular-nums">
            <span className="text-primary font-medium">{report.fee_sats.toLocaleString()} sat</span>
            <span className="text-muted-foreground ml-1">({report.fee_rate_sat_vb} sat/vB)</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>Fee paid to miners</TooltipContent>
      </Tooltip>

      <Sep />

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="tabular-nums text-muted-foreground">
            {report.vbytes} vB · {report.weight} WU
          </span>
        </TooltipTrigger>
        <TooltipContent>Virtual size and weight units</TooltipContent>
      </Tooltip>

      <Sep />

      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-zinc-800 text-zinc-300">
        {report.segwit ? "SegWit" : "Legacy"}
      </Badge>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="tabular-nums text-muted-foreground">
            {report.vin.length}→{report.vout.length}
          </span>
        </TooltipTrigger>
        <TooltipContent>{report.vin.length} inputs → {report.vout.length} outputs</TooltipContent>
      </Tooltip>

      {report.rbf_signaling && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-zinc-800 text-zinc-300">
              RBF
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Replace-By-Fee: sender can bump the fee</TooltipContent>
        </Tooltip>
      )}

      {report.segwit_savings && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-primary font-medium">
              −{report.segwit_savings.savings_pct}%
            </span>
          </TooltipTrigger>
          <TooltipContent>SegWit discount: {report.segwit_savings.savings_pct}% less weight</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function Sep() {
  return <span className="text-muted-foreground/30 select-none">·</span>;
}
