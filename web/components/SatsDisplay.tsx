import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SatsDisplayProps {
  sats: number;
  className?: string;
  showBtc?: boolean;
}

function formatSats(sats: number): string {
  return sats.toLocaleString("en-US");
}

function satsToBtc(sats: number): string {
  return (sats / 1e8).toFixed(8);
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
