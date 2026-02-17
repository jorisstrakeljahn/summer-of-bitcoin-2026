import type { TransactionReport } from "@/lib/types";
import { SatsDisplay } from "../SatsDisplay";
import { InfoTooltip } from "../InfoTooltip";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, TrendingDown } from "lucide-react";

interface FeeDetailProps {
  report: TransactionReport;
}

export function FeeDetail({ report }: FeeDetailProps) {
  const hasHighFee = report.warnings.some((w) => w.code === "HIGH_FEE");
  const savings = report.segwit_savings;

  return (
    <div className="space-y-5">
      {/* Fee Amount */}
      <div className="text-center space-y-1">
        <SatsDisplay sats={report.fee_sats} className="text-2xl font-bold" />
        <p className="text-sm text-muted-foreground">{report.fee_rate_sat_vb} sat/vB</p>
      </div>

      {/* Plain language */}
      <p className="text-xs text-muted-foreground leading-relaxed text-center">
        This is the &quot;tip&quot; paid to the miner who includes this transaction in a block.
        The higher the fee rate, the faster the transaction gets confirmed.
      </p>

      {/* High Fee Warning */}
      {hasHighFee && (
        <div className="flex items-start gap-2 rounded-lg bg-yellow-900/20 border border-yellow-800/30 p-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-yellow-300 mb-0.5">High Fee</p>
            <p className="text-muted-foreground">
              This fee is unusually high relative to the transaction size. The sender might be overpaying.
            </p>
          </div>
        </div>
      )}

      <Separator />

      {/* How fees work - expandable */}
      <Accordion type="single" collapsible>
        <AccordionItem value="fee-explain" className="border-0">
          <AccordionTrigger className="py-2 text-xs hover:no-underline">
            How do Bitcoin fees work?
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              Bitcoin fees are <strong>not</strong> a percentage — they depend on how much <em>block space</em> your
              transaction uses. A transaction sending 1 BTC can cost the same fee as one sending 0.001 BTC
              if they&apos;re the same size.
            </p>
            <p>
              The fee rate (sat/vB) tells miners how much you&apos;re paying per unit of space.
              When the network is busy, miners pick the highest-paying transactions first.
            </p>
            <p>
              The fee is simply: <code className="bg-secondary px-1 rounded">Total Inputs − Total Outputs = Fee</code>.
              There&apos;s no explicit &quot;fee field&quot; — whatever value isn&apos;t claimed by outputs goes to the miner.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* Fee Breakdown */}
      <DetailRow
        label="Total Input Value"
        explain="The sum of all coins being spent. This is the 'budget' for the transaction."
      >
        <SatsDisplay sats={report.total_input_sats} />
      </DetailRow>

      <DetailRow
        label="Total Output Value"
        explain="The sum of all coins sent to recipients. The 'leftover' becomes the fee."
      >
        <SatsDisplay sats={report.total_output_sats} />
      </DetailRow>

      <DetailRow
        label="Fee (the difference)"
        tooltip="Fee = Total Input − Total Output"
        explain="This is what the miner keeps as payment for including the transaction in a block."
      >
        <SatsDisplay sats={report.fee_sats} />
      </DetailRow>

      <DetailRow
        label="Transaction Size"
        explain="How much space this transaction takes in a block. Smaller = cheaper. SegWit helps reduce this."
      >
        <span className="tabular-nums text-xs">
          {report.vbytes} vB · {report.weight} WU
        </span>
      </DetailRow>

      <DetailRow
        label="Fee Rate"
        explain="The fee divided by the virtual size. This is what miners look at when choosing which transactions to include."
      >
        <span className="tabular-nums text-xs font-medium text-primary">
          {report.fee_rate_sat_vb} sat/vB
        </span>
      </DetailRow>

      {/* SegWit Savings */}
      {savings && (
        <>
          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-xs font-medium flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-primary" />
              SegWit Discount
              <InfoTooltip text="SegWit signature data is counted at 1/4 weight, making the effective size smaller." />
            </p>
            <span className="text-lg font-semibold text-primary tabular-nums">
              {savings.savings_pct}% saved
            </span>
          </div>

          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            Because this transaction uses SegWit, the signature data gets a 75% discount on weight.
            Without SegWit, this same transaction would weigh {savings.weight_if_legacy.toLocaleString()} WU
            instead of {savings.weight_actual.toLocaleString()} WU.
          </p>

          <div className="space-y-3">
            <BarComparison
              label="Actual Weight (SegWit)"
              value={savings.weight_actual}
              max={savings.weight_if_legacy}
              unit="WU"
              color="bg-primary"
            />
            <BarComparison
              label="Would-be Weight (Legacy)"
              value={savings.weight_if_legacy}
              max={savings.weight_if_legacy}
              unit="WU"
              color="bg-muted-foreground/40"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Witness</p>
              <p className="tabular-nums font-medium">{savings.witness_bytes} B</p>
              <p className="text-[10px] text-muted-foreground/50">signatures</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Non-Witness</p>
              <p className="tabular-nums font-medium">{savings.non_witness_bytes} B</p>
              <p className="text-[10px] text-muted-foreground/50">tx data</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Total</p>
              <p className="tabular-nums font-medium">{savings.total_bytes} B</p>
              <p className="text-[10px] text-muted-foreground/50">on disk</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BarComparison({ label, value, max, unit, color }: {
  label: string; value: number; max: number; unit: string; color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{value.toLocaleString()} {unit}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DetailRow({ label, tooltip, explain, children }: {
  label: string; tooltip?: string; explain?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </p>
      <div>{children}</div>
      {explain && (
        <p className="text-xs text-muted-foreground/60 leading-relaxed">{explain}</p>
      )}
    </div>
  );
}
