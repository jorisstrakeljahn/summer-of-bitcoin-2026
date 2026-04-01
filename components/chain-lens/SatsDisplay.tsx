import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatSats, satsToBtc } from "@/lib/chain-lens/utils";

interface SatsDisplayProps {
  sats: number;
  className?: string;
  showBtc?: boolean;
}

export function SatsDisplay({ sats, className, showBtc = true }: SatsDisplayProps) {
  const display = (
    <span className={cn("tabular-nums", className)}>
      {formatSats(sats)} <span className="text-muted-foreground">sat</span>
    </span>
  );

  if (!showBtc) return display;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{display}</TooltipTrigger>
      <TooltipContent>
        <span className="font-mono">{satsToBtc(sats)} BTC</span>
      </TooltipContent>
    </Tooltip>
  );
}
