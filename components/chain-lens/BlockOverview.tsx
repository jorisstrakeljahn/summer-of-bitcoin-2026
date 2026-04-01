import type { BlockReport } from "@/lib/chain-lens/types";
import { MetricCard } from "./MetricCard";
import { CopyButton } from "./CopyButton";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface BlockOverviewProps {
  report: BlockReport;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-10)}`;
}

export function BlockOverview({ report }: BlockOverviewProps) {
  const hdr = report.block_header;
  const ts = new Date(hdr.timestamp * 1000);

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard label="Block Hash">
        <span className="inline-flex items-center gap-1 font-mono text-xs">
          {truncateHash(hdr.block_hash)}
          <CopyButton text={hdr.block_hash} />
        </span>
      </MetricCard>

      <MetricCard label="BIP34 Height">
        <span className="tabular-nums">#{report.coinbase.bip34_height.toLocaleString()}</span>
      </MetricCard>

      <MetricCard label="Timestamp">
        {ts.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
      </MetricCard>

      <MetricCard label="Transactions">
        <span className="tabular-nums">{report.tx_count.toLocaleString()}</span>
      </MetricCard>

      <MetricCard label="Merkle Root">
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs">{truncateHash(hdr.merkle_root)}</span>
          {hdr.merkle_root_valid ? (
            <Badge className="bg-green-900/40 text-green-300 text-[10px]"><Check className="h-3 w-3 mr-0.5" />Valid</Badge>
          ) : (
            <Badge className="bg-red-900/40 text-red-300 text-[10px]"><X className="h-3 w-3 mr-0.5" />Invalid</Badge>
          )}
        </div>
      </MetricCard>

      <MetricCard label="Version / Nonce">
        <span className="tabular-nums">{hdr.version} / {hdr.nonce.toLocaleString()}</span>
      </MetricCard>
    </div>
  );
}
