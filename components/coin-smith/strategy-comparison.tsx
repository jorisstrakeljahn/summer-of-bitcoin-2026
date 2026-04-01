/**
 * Coin selection strategy comparison table.
 *
 * When multiple strategies produce a valid result, this table
 * shows them side-by-side so users can see the trade-offs between
 * approaches (fee, virtual size, input count, change presence).
 * The strategy with the lowest fee is automatically selected and
 * highlighted.
 */

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StrategySummary } from "@/lib/coin-smith/types";

interface StrategyComparisonProps {
  strategies: StrategySummary[];
  selected: string;
}

export function StrategyComparison({ strategies, selected }: StrategyComparisonProps) {
  if (strategies.length <= 1) return null;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">Strategy Comparison</h2>
        <p className="text-sm text-muted-foreground">
          All viable coin selection strategies ranked by fee. The best one is used automatically.
        </p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Strategy</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead className="text-right">vbytes</TableHead>
              <TableHead className="text-right">Inputs</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategies.map((s) => {
              const isBest = s.name === selected;
              return (
                <TableRow key={s.name} className={isBest ? "bg-primary/5" : ""}>
                  <TableCell className="font-mono text-sm">
                    {s.name.replace(/_/g, " ")}
                    {isBest && (
                      <Badge className="ml-2 text-xs bg-primary/15 text-primary border-primary/30">
                        best
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {s.fee.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {s.vbytes}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {s.inputCount}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {s.hasChange ? "Yes" : "No"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
