/**
 * Transaction warnings display.
 *
 * Shows safety warnings emitted by the build pipeline as hoverable
 * badges. Each warning code has a human-readable explanation that
 * appears in a tooltip on hover.
 *
 * Warning codes:
 *   HIGH_FEE       — Fee exceeds safety thresholds
 *   SEND_ALL       — No change output, all excess goes to miners
 *   DUST_CHANGE    — Change below dust threshold (defensive check)
 *   RBF_SIGNALING  — Transaction is replaceable via BIP-125
 */

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Warning {
  code: string;
}

const WARNING_INFO: Record<string, string> = {
  HIGH_FEE:
    "The fee exceeds 1,000,000 sats or the fee rate exceeds 200 sat/vB. Double-check before broadcasting.",
  SEND_ALL:
    "No change output was created — all leftover value is consumed as the mining fee.",
  DUST_CHANGE:
    "A change output exists but is below the dust threshold (546 sats). This should not happen with correct logic.",
  RBF_SIGNALING:
    "This transaction signals Replace-By-Fee (BIP-125), allowing it to be replaced with a higher-fee version before confirmation.",
};

interface WarningsDisplayProps {
  warnings: Warning[];
}

export function WarningsDisplay({ warnings }: WarningsDisplayProps) {
  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-base font-medium">Warnings</h2>
        <p className="text-sm text-muted-foreground">
          Safety checks for unusual or risky transaction properties.
          {warnings.length > 0 && " Hover for details."}
        </p>
      </div>

      {warnings.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No warnings — everything looks good.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {warnings.map((w, i) => (
            <Tooltip key={i}>
              <TooltipTrigger>
                <Badge variant="outline" className="font-mono text-xs py-1 px-2.5 cursor-help border-primary/40 text-primary">
                  {w.code}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-sm">
                {WARNING_INFO[w.code] ?? "Unknown warning."}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}
