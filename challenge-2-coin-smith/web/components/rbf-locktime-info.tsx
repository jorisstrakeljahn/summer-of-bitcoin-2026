/**
 * RBF and locktime information cards.
 *
 * Displays the Replace-By-Fee signaling status and nLockTime
 * configuration with human-readable explanations. The locktime
 * interpretation (block height vs. unix timestamp vs. none) is
 * derived from the BIP-65 threshold (500,000,000).
 */

import { Card, CardContent } from "@/components/ui/card";
import type { BuildReport } from "@/lib/core";

interface RbfLocktimeInfoProps {
  report: BuildReport;
}

export function RbfLocktimeInfo({ report }: RbfLocktimeInfoProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">RBF &amp; Locktime</h2>
        <p className="text-sm text-muted-foreground">
          <strong>RBF</strong> (Replace-By-Fee) lets the sender broadcast a new version of a
          transaction with a higher fee if the original is stuck unconfirmed.&nbsp;
          <strong>Locktime</strong> prevents a transaction from being mined before a certain
          block height or point in time — useful for scheduled payments or anti-fee-sniping.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4 px-5 space-y-1.5">
            <p className="text-sm text-muted-foreground">RBF Signaling</p>
            <p className="text-base font-medium">
              {report.rbf_signaling ? "Active" : "Inactive"}
            </p>
            <p className="text-sm text-muted-foreground">
              {report.rbf_signaling
                ? "All inputs set nSequence = 0xFFFFFFFD, allowing fee bumping before confirmation."
                : "Inputs use final sequence — this transaction cannot be replaced via BIP-125."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5 space-y-1.5">
            <p className="text-sm text-muted-foreground">Locktime</p>
            <p className="text-base font-medium font-mono">
              {report.locktime === 0 ? "None" : report.locktime.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {report.locktime_type === "none" && "No time restriction — the transaction is valid immediately."}
              {report.locktime_type === "block_height" &&
                `Locked until block ${report.locktime.toLocaleString()}. The transaction cannot be mined before this height.`}
              {report.locktime_type === "unix_timestamp" &&
                `Locked until ${new Date(report.locktime * 1000).toISOString().slice(0, 19)}Z. The transaction is time-locked.`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
