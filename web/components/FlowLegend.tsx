"use client";

import { Clock, AlertTriangle, FileCode } from "lucide-react";

export function FlowLegend() {
  return (
    <div className="rounded-lg border bg-card/90 backdrop-blur-sm px-3 py-2.5 text-[10px] text-muted-foreground space-y-1.5 max-w-[190px]">
      <p className="font-medium text-foreground text-xs">Legend</p>

      <LegendItem>
        <div className="h-3 w-5 rounded-sm bg-card border" />
        <span>Input / Output / Fee</span>
      </LegendItem>

      <LegendItem>
        <div className="h-3 w-5 rounded-sm border-2 border-zinc-500 bg-card" />
        <span>Transaction center</span>
      </LegendItem>

      <div className="border-t border-border pt-1.5 space-y-1">
        <LegendItem>
          <span className="inline-block w-5 h-0 border-t-2 border-dashed border-zinc-500" />
          <span>Value flow</span>
        </LegendItem>

        <LegendItem>
          <span className="inline-block w-5 h-0 border-t-2 border-dashed border-primary" />
          <span>Selected path</span>
        </LegendItem>

        <p className="text-muted-foreground/50 pl-7">Thicker = higher value</p>
      </div>

      <div className="border-t border-border pt-1.5 space-y-1">
        <LegendItem>
          <Clock className="h-3 w-3 text-purple-400 shrink-0" />
          <span>Timelock</span>
        </LegendItem>
        <LegendItem>
          <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />
          <span>Warning</span>
        </LegendItem>
        <LegendItem>
          <FileCode className="h-3 w-3 text-blue-400 shrink-0" />
          <span>OP_RETURN</span>
        </LegendItem>
      </div>
    </div>
  );
}

function LegendItem({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}
