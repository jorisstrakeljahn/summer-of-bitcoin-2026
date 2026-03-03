import { Badge } from "@/components/ui/badge";
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

function truncate(s: string, len = 14): string {
  if (s.length <= len) return s;
  const half = Math.floor((len - 1) / 2);
  return `${s.slice(0, half)}…${s.slice(-half)}`;
}

export function InputsTable({ inputs }: InputsTableProps) {
  const total = inputs.reduce((s, i) => s + i.value_sats, 0);

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
            {inputs.map((input, i) => (
              <TableRow key={`${input.txid}:${input.vout}`}>
                <TableCell className="font-mono text-sm text-muted-foreground">{i}</TableCell>
                <TableCell className="font-mono text-sm">
                  {truncate(input.txid)}:{input.vout}
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
