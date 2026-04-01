import type { TransactionReport } from "@/lib/chain-lens/types";
import { CopyButton } from "../CopyButton";
import { SatsDisplay } from "../SatsDisplay";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Repeat, Lock, Clock, AlertTriangle } from "lucide-react";
import { DetailRow, InfoBox } from "./shared";
import { satsToBtc } from "@/lib/chain-lens/utils";

interface TxDetailProps {
  report: TransactionReport;
}

export function TxDetail({ report }: TxDetailProps) {
  const hasAbsoluteTimelock = report.locktime_type !== "none";
  const hasRelativeTimelocks = report.vin.some((v) => v.relative_timelock.enabled);

  return (
    <div className="space-y-5">
      {/* Story-like summary */}
      <div className="space-y-2 leading-relaxed">
        <p className="text-sm text-foreground/80">
          This transaction takes{" "}
          <strong className="text-foreground">{satsToBtc(report.total_input_sats)} BTC</strong>{" "}
          from {report.vin.length} input{report.vin.length !== 1 ? "s" : ""} and distributes{" "}
          <strong className="text-foreground">{satsToBtc(report.total_output_sats)} BTC</strong>{" "}
          across {report.vout.length} output{report.vout.length !== 1 ? "s" : ""}.
          The remaining{" "}
          <strong className="text-primary">{report.fee_sats.toLocaleString()} sat</strong>{" "}
          goes to the miner as a processing fee.
        </p>
        <p className="text-sm text-foreground/50">
          Think of it like writing a check: you take money from your accounts (inputs),
          write amounts to recipients (outputs), and the bank keeps a small fee.
        </p>
      </div>

      <Separator />

      {/* Format Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {report.segwit ? (
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">SegWit</Badge>
        ) : (
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Legacy</Badge>
        )}
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Version {report.version}</Badge>
        {report.rbf_signaling && (
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
            <Repeat className="h-3 w-3 mr-1" />RBF
          </Badge>
        )}
      </div>

      {/* SegWit / Legacy Explanation */}
      <Accordion type="single" collapsible>
        <AccordionItem value="format-explain" className="border-0">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            What does {report.segwit ? "SegWit" : "Legacy"} mean?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-foreground/60 leading-relaxed">
            {report.segwit ? (
              <>
                <strong>Segregated Witness (SegWit)</strong> is a Bitcoin upgrade from 2017 that separates
                signature data (&quot;witness&quot;) from the main transaction. This has two benefits: transactions
                are effectively smaller (cheaper fees) and it fixes a bug called transaction malleability.
                {report.segwit_savings && (
                  <> This transaction saves <strong className="text-primary">{report.segwit_savings.savings_pct}%</strong> compared to the old format.</>
                )}
              </>
            ) : (
              <>
                <strong>Legacy</strong> transactions use the original Bitcoin format where all data
                (including signatures) is counted at full weight. Newer SegWit transactions would be
                cheaper because signature data gets a 75% discount on block space.
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* Key Metrics */}
      <DetailRow
        label="Transaction ID"
        tooltip="Unique fingerprint of this transaction."
        explain="Computed by hashing the transaction data twice with SHA-256. Like a receipt number — no two transactions have the same ID."
      >
        <div className="flex items-center gap-1">
          <code className="font-mono text-xs break-all flex-1">{report.txid}</code>
          <CopyButton text={report.txid} />
        </div>
      </DetailRow>

      {report.wtxid && (
        <DetailRow
          label="Witness TXID"
          tooltip="Alternative ID that includes witness data."
          explain="SegWit transactions have two IDs. This one includes the signature data, while the regular TXID doesn't. This fixes the 'transaction malleability' problem."
        >
          <div className="flex items-center gap-1">
            <code className="font-mono text-xs break-all flex-1">{report.wtxid}</code>
            <CopyButton text={report.wtxid} />
          </div>
        </DetailRow>
      )}

      <Separator />

      <DetailRow
        label="Size"
        tooltip="How much block space this transaction occupies."
        explain="Bitcoin blocks have a 4 million weight unit (WU) limit. Virtual bytes (vB) = WU ÷ 4. Smaller transactions are cheaper."
      >
        <span className="tabular-nums text-sm">
          {report.vbytes} vB · {report.weight} WU · {report.size_bytes} bytes
        </span>
      </DetailRow>

      <DetailRow
        label="Fee"
        tooltip="Amount paid to the miner."
        explain="Miners prioritize transactions with higher fee rates (sat/vB). A typical rate is 1-50 sat/vB depending on network congestion."
      >
        <div className="flex items-baseline gap-2">
          <SatsDisplay sats={report.fee_sats} />
          <span className="text-sm text-foreground/50">({report.fee_rate_sat_vb} sat/vB)</span>
        </div>
      </DetailRow>

      <DetailRow label="Total Input" explain="The total value of all coins being spent.">
        <SatsDisplay sats={report.total_input_sats} />
      </DetailRow>

      <DetailRow label="Total Output" explain="The total value sent to all recipients (excluding the fee).">
        <SatsDisplay sats={report.total_output_sats} />
      </DetailRow>

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <>
          <Separator />
          <p className="text-sm font-medium flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            Warnings
          </p>
          {report.warnings.map((w, i) => (
            <div key={i} className="rounded-lg bg-yellow-900/20 border border-yellow-800/30 p-3">
              <p className="font-medium text-yellow-300 text-sm mb-0.5">{w.code.replace(/_/g, " ")}</p>
              <p className="text-sm text-foreground/60">{warningText(w.code)}</p>
            </div>
          ))}
        </>
      )}

      {/* Timelocks */}
      {(hasAbsoluteTimelock || hasRelativeTimelocks || report.rbf_signaling) && (
        <>
          <Separator />
          <p className="text-sm font-medium">Timelocks & RBF</p>
          <p className="text-sm text-foreground/50 leading-relaxed">
            These features control <em>when</em> a transaction can be confirmed and whether it can be replaced.
          </p>

          {report.rbf_signaling && (
            <InfoBox icon={<Repeat className="h-4 w-4 text-blue-400" />} title="Replace-By-Fee (BIP125)">
              The sender can broadcast a new version of this transaction with a higher fee to get it confirmed faster.
              This is useful when the network is congested and the original fee was too low.
            </InfoBox>
          )}

          {hasAbsoluteTimelock && (
            <InfoBox icon={<Lock className="h-4 w-4 text-yellow-400" />} title="Absolute Locktime">
              This transaction cannot be included in a block until after{" "}
              {report.locktime_type === "block_height"
                ? `block #${report.locktime_value.toLocaleString()}`
                : new Date(report.locktime_value * 1000).toLocaleString()}.
              This is like post-dating a check — the bank won&apos;t process it until the date arrives.
            </InfoBox>
          )}

          {hasRelativeTimelocks && report.vin.map((vin, i) => {
            if (!vin.relative_timelock.enabled) return null;
            const rt = vin.relative_timelock;
            return (
              <InfoBox key={i} icon={<Clock className="h-4 w-4 text-purple-400" />} title={`Input #${i} Relative Timelock`}>
                Must wait {rt.type === "blocks"
                  ? `${rt.value} block${rt.value !== 1 ? "s" : ""} (~${rt.value * 10} minutes)`
                  : `${rt.value} seconds`} after the previous output was confirmed.
              </InfoBox>
            );
          })}
        </>
      )}
    </div>
  );
}

function warningText(code: string): string {
  switch (code) {
    case "HIGH_FEE": return "This transaction pays an unusually high fee. The sender may be overpaying for confirmation speed.";
    case "DUST_OUTPUT": return "One or more outputs hold so few satoshis that it costs more in fees to spend them than they're worth.";
    case "UNKNOWN_OUTPUT_SCRIPT": return "Contains an output with a script type that doesn't match any standard Bitcoin template.";
    case "RBF_SIGNALING": return "This transaction can be replaced with a higher-fee version before confirmation (Replace-By-Fee).";
    default: return code;
  }
}

