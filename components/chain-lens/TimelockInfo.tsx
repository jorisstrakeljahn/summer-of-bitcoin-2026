import type { TransactionReport } from "@/lib/chain-lens/types";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Repeat, Lock } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

interface TimelockInfoProps {
  report: TransactionReport;
}

export function TimelockInfo({ report }: TimelockInfoProps) {
  const hasAbsoluteTimelock = report.locktime_type !== "none";
  const hasRelativeTimelocks = report.vin.some((v) => v.relative_timelock.enabled);
  const hasRbf = report.rbf_signaling;

  if (!hasAbsoluteTimelock && !hasRelativeTimelocks && !hasRbf) return null;

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Timelocks & RBF
          <InfoTooltip text="Timelocks prevent a transaction from being included in a block until a certain condition is met. RBF allows replacing an unconfirmed transaction." />
        </p>

        {hasRbf && (
          <div className="flex items-start gap-2 text-sm">
            <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
            <p>
              <strong>RBF Signaling</strong> — This transaction can be replaced with a higher-fee
              version before it is confirmed in a block.
            </p>
          </div>
        )}

        {hasAbsoluteTimelock && (
          <div className="flex items-start gap-2 text-sm">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
            <p>
              <strong>Absolute Locktime</strong> — Valid only after{" "}
              {report.locktime_type === "block_height"
                ? `block #${report.locktime_value.toLocaleString()}`
                : new Date(report.locktime_value * 1000).toLocaleString()}
              .
            </p>
          </div>
        )}

        {hasRelativeTimelocks && report.vin.map((vin, i) => {
          if (!vin.relative_timelock.enabled) return null;
          const rt = vin.relative_timelock;
          return (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
              <p>
                <strong>Input #{i} Relative Timelock</strong> —{" "}
                {rt.type === "blocks"
                  ? `Must wait ${rt.value} block${rt.value !== 1 ? "s" : ""}`
                  : `Must wait ${rt.value} seconds`}{" "}
                after the referenced output was confirmed.
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
