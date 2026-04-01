/**
 * Transaction outputs table.
 *
 * Shows payment destinations and the change output (if any). The
 * change output is visually tagged so users can distinguish where
 * funds are going vs. what returns to their wallet.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { CopyableText } from "@/components/copyable-text";
import { ExpandControls } from "@/components/expand-controls";
import { useProgressiveList } from "@/hooks/use-progressive-list";
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

const LOAD_MORE_STEP = 10;

export function OutputsTable({ outputs }: OutputsTableProps) {
  const { visible, remaining, showMore, showAll } = useProgressiveList(outputs);
  const total = outputs.reduce((s, o) => s + o.value_sats, 0);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">
          Outputs
          <span className="text-muted-foreground font-normal ml-1.5">({outputs.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Each output sends value to a Bitcoin address. Payment outputs go to the recipient.
          If the selected inputs exceed the payment + fee, a <strong>change</strong> output
          returns the leftover to the sender&apos;s wallet — just like receiving coins back at a
          cash register. Outputs below 546 sats are considered <strong>dust</strong> and are
          rejected by the network because they cost more in fees to spend than they are worth.
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
            <ExpandControls
              remaining={remaining}
              total={outputs.length}
              step={LOAD_MORE_STEP}
              onShowMore={showMore}
              onShowAll={showAll}
            />
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
