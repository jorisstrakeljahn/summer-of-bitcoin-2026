import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "./InfoTooltip";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, tooltip, children, className }: MetricCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-4 pb-4">
        <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </p>
        <div className="text-sm font-medium">{children}</div>
      </CardContent>
    </Card>
  );
}
