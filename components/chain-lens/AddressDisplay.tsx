import { CopyButton } from "./CopyButton";
import { cn } from "@/lib/chain-lens/utils";

interface AddressDisplayProps {
  address: string | null;
  className?: string;
}

function truncate(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

export function AddressDisplay({ address, className }: AddressDisplayProps) {
  if (!address) {
    return <span className="text-muted-foreground italic">No address</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-sm", className)}>
      <span title={address}>{truncate(address)}</span>
      <CopyButton text={address} />
    </span>
  );
}
