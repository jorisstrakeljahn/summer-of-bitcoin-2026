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

interface SelectedInput {
  txid: string;
  vout: number;
  value_sats: number;
  script_type: string;
  address: string;
}

interface InputsTableProps {
  inputs: SelectedInput[];
}

const INITIAL_VISIBLE = 5;
const LOAD_MORE_STEP = 10;

export function InputsTable({ inputs }: InputsTableProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const total = inputs.reduce((s, i) => s + i.value_sats, 0);

  const needsExpansion = inputs.length > INITIAL_VISIBLE;
  const visible = needsExpansion ? inputs.slice(0, visibleCount) : inputs;
  const remaining = inputs.length - visibleCount;

  function showMore() {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_STEP, inputs.length));
  }

  function showAll() {
    setVisibleCount(inputs.length);
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">
          Selected Inputs
          <span className="text-muted-foreground font-normal ml-1.5">({inputs.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          The UTXOs selected from the available pool to fund this transaction.
        </p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Outpoint</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((input, i) => (
              <TableRow key={`${input.txid}:${input.vout}`}>
                <TableCell className="font-mono text-sm text-muted-foreground">{i}</TableCell>
                <TableCell className="font-mono text-sm">
                  <span className="inline-flex items-center gap-0.5">
                    <CopyableText text={input.txid} truncateLen={16} className="text-sm" />
                    <span className="text-muted-foreground">:{input.vout}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {input.value_sats.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {input.script_type}
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
                          show all {inputs.length}
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
