/**
 * Selected inputs table.
 *
 * Displays the UTXOs chosen by the coin selection algorithm, with
 * progressive expansion for large input sets (e.g. UTXO consolidation
 * transactions with 100+ inputs).
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { CopyableText } from "@/components/coin-smith/copyable-text";
import { ExpandControls } from "@/components/coin-smith/expand-controls";
import { useProgressiveList } from "@/lib/coin-smith/use-progressive-list";
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

const LOAD_MORE_STEP = 10;

export function InputsTable({ inputs }: InputsTableProps) {
  const { visible, remaining, showMore, showAll } = useProgressiveList(inputs);
  const total = inputs.reduce((s, i) => s + i.value_sats, 0);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">
          Selected Inputs
          <span className="text-muted-foreground font-normal ml-1.5">({inputs.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Bitcoin wallets don&apos;t hold a single balance — they track individual coins called UTXOs
          (Unspent Transaction Outputs). To send bitcoin, the wallet selects one or more of
          these coins as inputs. The total input value must cover the payment amount plus the
          mining fee.
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
            <ExpandControls
              remaining={remaining}
              total={inputs.length}
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
