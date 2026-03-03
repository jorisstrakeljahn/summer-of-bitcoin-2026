"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CopyableText } from "@/components/copyable-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OutputEntry {
  n: number;
  value_sats: number;
  script_type: string;
  address: string;
  is_change: boolean;
}

interface OutputsTableProps {
  outputs: OutputEntry[];
}

const INITIAL_VISIBLE = 5;
const LOAD_MORE_STEP = 10;

export function OutputsTable({ outputs }: OutputsTableProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const total = outputs.reduce((s, o) => s + o.value_sats, 0);

  const needsExpansion = outputs.length > INITIAL_VISIBLE;
  const visible = needsExpansion ? outputs.slice(0, visibleCount) : outputs;
  const remaining = outputs.length - visibleCount;

  function showMore() {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_STEP, outputs.length));
  }

  function showAll() {
    setVisibleCount(outputs.length);
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">
          Outputs
          <span className="text-muted-foreground font-normal ml-1.5">({outputs.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Payment destinations and change. The change output returns leftover value back to your wallet.
        </p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((output) => (
              <TableRow key={output.n}>
                <TableCell className="font-mono text-sm text-muted-foreground">{output.n}</TableCell>
                <TableCell className="font-mono text-sm">
                  <span className="flex items-center gap-1 flex-wrap">
                    <CopyableText text={output.address} truncateLen={20} />
                    {output.is_change && (
                      <Badge className="text-xs bg-primary/15 text-primary border-primary/30">
                        change
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {output.value_sats.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {output.script_type}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {remaining > 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-2">
                  <span className="inline-flex items-center gap-3">
                    <button
                      onClick={showMore}
                      className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium"
                    >
                      +{Math.min(LOAD_MORE_STEP, remaining)} more
                    </button>
                    {remaining > LOAD_MORE_STEP && (
                      <>
                        <span className="text-muted-foreground text-xs">|</span>
                        <button
                          onClick={showAll}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          show all {outputs.length}
                        </button>
                      </>
                    )}
                  </span>
                </TableCell>
              </TableRow>
            )}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={2} className="text-sm font-medium">Total</TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">
                {total.toLocaleString()}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
