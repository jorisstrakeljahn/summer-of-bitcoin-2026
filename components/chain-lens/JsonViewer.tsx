import { CopyButton } from "./CopyButton";
import { cn } from "@/lib/chain-lens/utils";

interface JsonViewerProps {
  data: unknown;
  className?: string;
  maxHeight?: string;
}

export function JsonViewer({ data, className, maxHeight = "60vh" }: JsonViewerProps) {
  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  return (
    <div className={cn("relative rounded-lg border bg-background", className)}>
      <div className="absolute right-2 top-2 z-10">
        <CopyButton text={json} />
      </div>
      <div
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <pre className="p-4 text-xs font-mono leading-relaxed text-muted-foreground whitespace-pre">
          {json}
        </pre>
      </div>
    </div>
  );
}
