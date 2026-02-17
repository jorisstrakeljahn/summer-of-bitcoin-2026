import type { TransactionReport } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "./InfoTooltip";

interface StoryViewProps {
  report: TransactionReport;
}

function satsToBtc(sats: number): string {
  return (sats / 1e8).toFixed(8);
}

function uniqueAddresses(report: TransactionReport, field: "vin" | "vout"): number {
  const addrs = new Set(
    report[field]
      .map((e) => ("address" in e ? e.address : null))
      .filter(Boolean),
  );
  return addrs.size;
}

export function StoryView({ report }: StoryViewProps) {
  const inputCount = report.vin.length;
  const outputCount = report.vout.length;
  const uniqueInputAddrs = uniqueAddresses(report, "vin");
  const uniqueOutputAddrs = uniqueAddresses(report, "vout");
  const opReturnOutputs = report.vout.filter((o) => o.script_type === "op_return");
  const hasOpReturn = opReturnOutputs.length > 0;

  return (
    <Card>
      <CardContent className="pt-6 space-y-2 text-sm leading-relaxed">
        <p>
          This transaction spends{" "}
          <strong className="text-foreground">{satsToBtc(report.total_input_sats)} BTC</strong>{" "}
          from {inputCount} input{inputCount !== 1 ? "s" : ""}{" "}
          ({uniqueInputAddrs} address{uniqueInputAddrs !== 1 ? "es" : ""}).{" "}
          <InfoTooltip text="Inputs reference previously received coins (unspent transaction outputs) that are being spent in this transaction." />
        </p>

        <p>
          <strong className="text-foreground">{satsToBtc(report.total_output_sats)} BTC</strong>{" "}
          goes to {outputCount} output{outputCount !== 1 ? "s" : ""}{" "}
          ({uniqueOutputAddrs} address{uniqueOutputAddrs !== 1 ? "es" : ""}),
          and{" "}
          <strong className="text-primary">{report.fee_sats.toLocaleString()} sat</strong>{" "}
          goes to the miner as a fee.{" "}
          <InfoTooltip text="The fee is the difference between total input value and total output value. Miners collect fees as incentive to include transactions in blocks." />
        </p>

        {report.segwit && report.segwit_savings && (
          <p>
            This is a <strong>SegWit</strong> transaction, saving{" "}
            <strong className="text-primary">{report.segwit_savings.savings_pct}%</strong> in fees
            compared to legacy format.{" "}
            <InfoTooltip text="SegWit (Segregated Witness) moves signature data into a separate section, making the effective transaction size smaller and fees lower." />
          </p>
        )}

        {!report.segwit && (
          <p>
            This is a <strong>Legacy</strong> transaction without SegWit.{" "}
            <InfoTooltip text="Legacy transactions include all data in one section. SegWit transactions are more efficient because they separate signature data." />
          </p>
        )}

        {report.rbf_signaling && (
          <p>
            It signals <strong>RBF</strong> — the sender can replace it with a higher-fee version
            before confirmation.{" "}
            <InfoTooltip text="Replace-By-Fee (RBF) means this transaction can be replaced by a new version with a higher fee while it's still unconfirmed in the mempool." />
          </p>
        )}

        {hasOpReturn && opReturnOutputs.map((o, i) => (
          <p key={i}>
            Contains an <strong>OP_RETURN</strong> output
            {o.op_return_data_utf8 ? (
              <>
                {" "}with the message: <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono">{o.op_return_data_utf8}</code>
              </>
            ) : (
              <> with embedded data</>
            )}.{" "}
            <InfoTooltip text="OP_RETURN outputs store arbitrary data on the blockchain. They are provably unspendable and don't create new coins." />
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
