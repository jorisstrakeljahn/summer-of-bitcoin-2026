import type { BlockReport } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { SatsDisplay } from "./SatsDisplay";
import { ScriptBadge } from "./ScriptBadge";

interface BlockStatsProps {
  report: BlockReport;
}

export function BlockStats({ report }: BlockStatsProps) {
  const stats = report.block_stats;
  const sortedTypes = Object.entries(stats.script_type_summary)
    .sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Fees</p>
            <SatsDisplay sats={stats.total_fees_sats} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Weight</p>
            <span className="tabular-nums">{stats.total_weight.toLocaleString()} WU</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Fee Rate</p>
            <span className="tabular-nums">{stats.avg_fee_rate_sat_vb} sat/vB</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Script Type Distribution</p>
          <div className="flex flex-wrap gap-2">
            {sortedTypes.map(([type, count]) => (
              <div key={type} className="flex items-center gap-1.5">
                <ScriptBadge type={type} />
                <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Coinbase Reward</p>
          <SatsDisplay sats={report.coinbase.total_output_sats} />
        </div>
      </CardContent>
    </Card>
  );
}
