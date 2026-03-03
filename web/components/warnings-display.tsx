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
  if (warnings.length === 0) {
    return (
      <div className="space-y-2">
        <div>
          <h2 className="text-sm font-medium">Warnings</h2>
          <p className="text-xs text-muted-foreground">
            Safety checks for unusual or risky transaction properties.
          </p>
        </div>
        <p className="text-xs text-muted-foreground italic">No warnings — everything looks good.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-medium">Warnings</h2>
        <p className="text-xs text-muted-foreground">
          Safety checks for unusual or risky transaction properties. Hover for details.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {warnings.map((w, i) => (
          <Tooltip key={i}>
            <TooltipTrigger>
              <Badge variant="outline" className="font-mono text-xs cursor-help border-primary/40 text-primary">
                {w.code}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              {WARNING_INFO[w.code] ?? "Unknown warning."}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
