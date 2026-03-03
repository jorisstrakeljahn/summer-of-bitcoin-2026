import { Card, CardContent } from "@/components/ui/card";
import type { BuildReport } from "@/lib/core";

interface TransactionSummaryProps {
  report: BuildReport;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold font-mono tracking-tight mt-1">{value}</p>
        {sub && <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>}
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
          Overview of the constructed transaction — fees, size, and strategy used.
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
