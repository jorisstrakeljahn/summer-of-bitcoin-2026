import type { SegwitSavings as SegwitSavingsType } from "@/lib/chain-lens/types";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "./InfoTooltip";

interface SegwitSavingsProps {
  savings: SegwitSavingsType;
}

export function SegwitSavings({ savings }: SegwitSavingsProps) {
  const maxWeight = Math.max(savings.weight_actual, savings.weight_if_legacy);
  const actualPct = (savings.weight_actual / maxWeight) * 100;
  const legacyPct = (savings.weight_if_legacy / maxWeight) * 100;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            SegWit Discount
            <InfoTooltip text="SegWit transactions store witness (signature) data separately. This data is counted at a discount (1/4 weight), making the transaction effectively smaller and cheaper." />
          </p>
          <span className="text-lg font-semibold text-primary tabular-nums">
            {savings.savings_pct}% saved
          </span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Actual Weight</span>
              <span className="tabular-nums text-muted-foreground">{savings.weight_actual.toLocaleString()} WU</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${actualPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Hypothetical Legacy Weight</span>
              <span className="tabular-nums text-muted-foreground">{savings.weight_if_legacy.toLocaleString()} WU</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-muted-foreground/40 transition-all"
                style={{ width: `${legacyPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <p className="text-muted-foreground">Witness</p>
            <p className="tabular-nums font-medium">{savings.witness_bytes} bytes</p>
          </div>
          <div>
            <p className="text-muted-foreground">Non-Witness</p>
            <p className="tabular-nums font-medium">{savings.non_witness_bytes} bytes</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="tabular-nums font-medium">{savings.total_bytes} bytes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
