import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/chain-lens/utils";

interface InfoTooltipProps {
  text: string;
  className?: string;
}

export function InfoTooltip({ text, className }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className={cn("inline h-3.5 w-3.5 text-muted-foreground cursor-help", className)} />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm" side="top">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
