import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SCRIPT_COLORS: Record<string, string> = {
  p2pkh: "bg-zinc-700 text-zinc-100",
  p2sh: "bg-zinc-600 text-zinc-100",
  "p2sh-p2wpkh": "bg-blue-900/60 text-blue-200",
  "p2sh-p2wsh": "bg-blue-900/60 text-blue-200",
  p2wpkh: "bg-sky-900/60 text-sky-200",
  p2wsh: "bg-sky-900/60 text-sky-200",
  p2tr: "bg-orange-900/60 text-orange-200",
  p2tr_keypath: "bg-orange-900/60 text-orange-200",
  p2tr_scriptpath: "bg-orange-900/60 text-orange-200",
  op_return: "bg-zinc-800 text-zinc-400",
  unknown: "bg-yellow-900/60 text-yellow-200",
};

const SCRIPT_LABELS: Record<string, string> = {
  p2pkh: "P2PKH",
  p2sh: "P2SH",
  "p2sh-p2wpkh": "P2SH-P2WPKH",
  "p2sh-p2wsh": "P2SH-P2WSH",
  p2wpkh: "P2WPKH",
  p2wsh: "P2WSH",
  p2tr: "P2TR",
  p2tr_keypath: "Taproot Key",
  p2tr_scriptpath: "Taproot Script",
  op_return: "OP_RETURN",
  unknown: "Unknown",
};

interface ScriptBadgeProps {
  type: string;
  className?: string;
}

export function ScriptBadge({ type, className }: ScriptBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-mono text-xs",
        SCRIPT_COLORS[type] ?? SCRIPT_COLORS.unknown,
        className,
      )}
    >
      {SCRIPT_LABELS[type] ?? type.toUpperCase()}
    </Badge>
  );
}
