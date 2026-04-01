/**
 * Transaction summary cards.
 *
 * Displays the four key metrics of a built transaction at a glance:
 * fee (absolute + rate), virtual size, input/output count, and the
 * coin selection strategy that was used.
 */

import { Card, CardContent } from "@/components/ui/card";
import type { BuildReport } from "@/lib/coin-smith/core";

interface TransactionSummaryProps {
  report: BuildReport;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-3 pb-2.5 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-semibold font-mono tracking-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function TransactionSummary({ report }: TransactionSummaryProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">Transaction Summary</h2>
        <p className="text-sm text-muted-foreground">
          Every Bitcoin transaction pays a mining fee proportional to its size in virtual bytes
          (vB), not the amount being sent. Adding more inputs or outputs increases the size and
          therefore the fee. The fee rate (sat/vB) determines how quickly miners will include
          the transaction in a block.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Fee"
          value={`${report.fee_sats.toLocaleString()} sats`}
          sub={`${report.fee_rate_sat_vb.toFixed(2)} sat/vB`}
        />
        <StatCard
          label="Virtual Size"
          value={`${report.vbytes} vB`}
        />
        <StatCard
          label="Inputs / Outputs"
          value={`${report.selected_inputs.length} → ${report.outputs.length}`}
        />
        <StatCard
          label="Strategy"
          value={report.strategy.replace(/_/g, " ")}
        />
      </div>
    </div>
  );
}
