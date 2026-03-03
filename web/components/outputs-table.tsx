import { Badge } from "@/components/ui/badge";
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
  changeIndex: number | null;
}

function truncate(s: string, len = 18): string {
  if (s.length <= len) return s;
  const half = Math.floor((len - 1) / 2);
  return `${s.slice(0, half)}…${s.slice(-half)}`;
}

export function OutputsTable({ outputs, changeIndex }: OutputsTableProps) {
  const total = outputs.reduce((s, o) => s + o.value_sats, 0);

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
            {outputs.map((output) => (
              <TableRow key={output.n}>
                <TableCell className="font-mono text-sm text-muted-foreground">{output.n}</TableCell>
                <TableCell className="font-mono text-sm">
                  {truncate(output.address)}
                  {output.is_change && (
                    <Badge className="ml-2 text-xs bg-primary/15 text-primary border-primary/30">
                      change
                    </Badge>
                  )}
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
