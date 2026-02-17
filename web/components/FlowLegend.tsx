"use client";

import { ArrowRight, Clock, AlertTriangle, FileCode } from "lucide-react";

export function FlowLegend() {
  return (
    <div className="rounded-lg border bg-card/90 backdrop-blur-sm px-3 py-2 text-[10px] text-muted-foreground space-y-1.5 max-w-[200px]">
      <p className="font-medium text-foreground text-xs mb-1">Legend</p>

      <div className="flex items-center gap-2">
        <div className="h-2.5 w-5 rounded-sm bg-card border" />
        <span>Input (coins being spent)</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2.5 w-5 rounded-sm bg-card border" />
        <span>Output (destination)</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2.5 w-5 rounded-sm border-2 border-primary/40 bg-card" />
        <span>Transaction center</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2.5 w-5 rounded-sm bg-primary/10 border border-primary/30" />
        <span>Miner fee</span>
      </div>

      <div className="border-t border-border pt-1.5 mt-1.5 space-y-1">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-3 w-3 text-[#71717a]" />
          <span>Value flow (thicker = more sat)</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight className="h-3 w-3 text-primary" />
          <span>Selected path</span>
        </div>
      </div>

      <div className="border-t border-border pt-1.5 mt-1.5 space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-purple-400" />
          <span>Has timelock</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-yellow-400" />
          <span>Dust / high fee warning</span>
        </div>
        <div className="flex items-center gap-2">
          <FileCode className="h-3 w-3 text-blue-400" />
          <span>OP_RETURN data</span>
        </div>
      </div>
    </div>
  );
}
