import type { TransactionReport } from "@/lib/chain-lens/types";
import { MetricCard } from "./MetricCard";
import { SatsDisplay } from "./SatsDisplay";
import { CopyButton } from "./CopyButton";
import { Badge } from "@/components/ui/badge";

interface MetricsCardsProps {
  report: TransactionReport;
}

function truncateTxid(txid: string): string {
  return `${txid.slice(0, 10)}…${txid.slice(-10)}`;
}

function locktimeLabel(report: TransactionReport): string {
  if (report.locktime_type === "none") return "None";
  if (report.locktime_type === "block_height") return `Block #${report.locktime_value.toLocaleString()}`;
  const date = new Date(report.locktime_value * 1000);
  return date.toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function MetricsCards({ report }: MetricsCardsProps) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard label="Transaction ID" tooltip="A unique identifier for this transaction, computed by double-SHA256 hashing the transaction data.">
        <span className="inline-flex items-center gap-1 font-mono text-xs">
          {truncateTxid(report.txid)}
          <CopyButton text={report.txid} />
        </span>
      </MetricCard>

      <MetricCard label="Fee" tooltip="The difference between total input value and total output value. This goes to the miner who includes this transaction in a block.">
        <div className="flex items-baseline gap-2">
          <SatsDisplay sats={report.fee_sats} />
          <span className="text-xs text-muted-foreground">
            ({report.fee_rate_sat_vb} sat/vB)
          </span>
        </div>
      </MetricCard>

      <MetricCard label="Size" tooltip="The virtual size determines how much block space this transaction uses. Weight Units (WU) divide by 4 to get virtual bytes (vB).">
        <span className="tabular-nums">
          {report.vbytes} <span className="text-muted-foreground">vB</span>
          {" · "}
          {report.weight} <span className="text-muted-foreground">WU</span>
          {" · "}
          {report.size_bytes} <span className="text-muted-foreground">bytes</span>
        </span>
      </MetricCard>

      <MetricCard label="Format" tooltip="SegWit transactions separate signature data (witness) from the rest, reducing effective size and fees.">
        <div className="flex items-center gap-2">
          {report.segwit ? (
            <Badge className="bg-primary/20 text-primary">SegWit</Badge>
          ) : (
            <Badge variant="secondary">Legacy</Badge>
          )}
          <span className="text-xs text-muted-foreground">Version {report.version}</span>
        </div>
      </MetricCard>

      <MetricCard label="Inputs / Outputs" tooltip="Inputs are previously received coins being spent. Outputs are the new destinations for the value.">
        <span className="tabular-nums">
          {report.vin.length} input{report.vin.length !== 1 ? "s" : ""}
          {" → "}
          {report.vout.length} output{report.vout.length !== 1 ? "s" : ""}
        </span>
      </MetricCard>

      <MetricCard label="Locktime" tooltip="Locktime restricts when a transaction can be included in a block — either by block height or timestamp.">
        {locktimeLabel(report)}
      </MetricCard>
    </div>
  );
}
