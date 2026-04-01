import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/chain-lens/utils";

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
  coinbase: "Coinbase",
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
        "font-mono text-xs bg-zinc-800 text-zinc-300 border-zinc-700",
        className,
      )}
    >
      {SCRIPT_LABELS[type] ?? type.toUpperCase()}
    </Badge>
  );
}
