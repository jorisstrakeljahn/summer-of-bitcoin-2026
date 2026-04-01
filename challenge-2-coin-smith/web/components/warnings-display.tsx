/**
 * Transaction warnings display.
 *
 * Shows safety warnings emitted by the build pipeline as inline
 * cards with the warning code badge and a human-readable explanation
 * visible without hover interaction.
 */

import { Badge } from "@/components/ui/badge";

interface Warning {
  code: string;
}

const WARNING_INFO: Record<string, { label: string; description: string }> = {
  HIGH_FEE: {
    label: "High Fee",
    description:
      "The fee exceeds 1,000,000 sats or the effective fee rate exceeds 200 sat/vB — an unusually high amount. Double-check the fee rate before broadcasting.",
  },
  SEND_ALL: {
    label: "Send All",
    description:
      "No change output was created. All leftover value after paying the recipients is consumed as the mining fee. This happens when the remainder would be too small to spend (below the dust threshold of 546 sats).",
  },
  DUST_CHANGE: {
    label: "Dust Change",
    description:
      "A change output exists but is below the dust threshold (546 sats). Dust outputs are uneconomical to spend because the fee to use them exceeds their value.",
  },
  RBF_SIGNALING: {
    label: "RBF Signaling",
    description:
      "This transaction signals Replace-By-Fee (BIP-125) via nSequence. The sender can broadcast a replacement with a higher fee if the original doesn't confirm quickly enough.",
  },
};

interface WarningsDisplayProps {
  warnings: Warning[];
}

export function WarningsDisplay({ warnings }: WarningsDisplayProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">Warnings</h2>
        <p className="text-sm text-muted-foreground">
          Safety checks for unusual or risky transaction properties.
        </p>
      </div>

      {warnings.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No warnings — everything looks good.</p>
      ) : (
        <div className="space-y-2">
          {warnings.map((w, i) => {
            const info = WARNING_INFO[w.code];
            return (
              <div key={i} className="border rounded-lg p-3 bg-muted/20 flex gap-3 items-start">
                <Badge variant="outline" className="font-mono text-xs py-1 px-2.5 shrink-0 border-primary/40 text-primary mt-0.5">
                  {w.code}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{info?.label ?? w.code}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {info?.description ?? "Unknown warning."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
