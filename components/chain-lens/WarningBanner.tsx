import type { Warning } from "@/lib/chain-lens/types";
import { AlertTriangle, CircleDollarSign, Repeat, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/chain-lens/utils";

const WARNING_CONFIG: Record<string, {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}> = {
  HIGH_FEE: {
    icon: CircleDollarSign,
    title: "High Fee",
    description: "This transaction pays an unusually high fee. Double-check the amount before broadcasting.",
    color: "border-red-500/30 bg-red-500/5 text-red-300",
  },
  DUST_OUTPUT: {
    icon: AlertTriangle,
    title: "Dust Output",
    description: "One or more outputs are extremely small (< 546 sat). Some nodes may reject this transaction.",
    color: "border-orange-500/30 bg-orange-500/5 text-orange-300",
  },
  RBF_SIGNALING: {
    icon: Repeat,
    title: "Replace-By-Fee",
    description: "This transaction can be replaced with a higher-fee version before it is confirmed.",
    color: "border-blue-500/30 bg-blue-500/5 text-blue-300",
  },
  UNKNOWN_OUTPUT_SCRIPT: {
    icon: HelpCircle,
    title: "Unknown Script Type",
    description: "One or more outputs use an unrecognized script type.",
    color: "border-yellow-500/30 bg-yellow-500/5 text-yellow-300",
  },
};

interface WarningBannerProps {
  warnings: Warning[];
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {warnings.map((w) => {
        const config = WARNING_CONFIG[w.code];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <Card key={w.code} className={cn("border", config.color)}>
            <CardContent className="flex items-start gap-3 pt-4 pb-4">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">{config.title}</p>
                <p className="text-xs opacity-80">{config.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
