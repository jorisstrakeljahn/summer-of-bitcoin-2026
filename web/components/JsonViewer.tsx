import { CopyButton } from "./CopyButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: unknown;
  className?: string;
  maxHeight?: string;
}

export function JsonViewer({ data, className, maxHeight = "400px" }: JsonViewerProps) {
  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  return (
    <div className={cn("relative rounded-lg border bg-background", className)}>
      <div className="absolute right-2 top-2 z-10">
        <CopyButton text={json} />
      </div>
      <ScrollArea style={{ maxHeight }}>
        <pre className="p-4 text-xs font-mono leading-relaxed text-muted-foreground overflow-x-auto">
          {json}
        </pre>
      </ScrollArea>
    </div>
  );
}
