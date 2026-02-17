import type { VinEntry } from "@/lib/types";
import { ScriptBadge } from "../ScriptBadge";
import { AddressDisplay } from "../AddressDisplay";
import { SatsDisplay } from "../SatsDisplay";
import { CopyButton } from "../CopyButton";
import { InfoTooltip } from "../InfoTooltip";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, Hash } from "lucide-react";
import { DetailRow, ScriptBlock } from "./shared";

interface InputDetailProps {
  vin: VinEntry;
  index: number;
}

function relTimelockText(vin: VinEntry): string | null {
  const rt = vin.relative_timelock;
  if (!rt.enabled) return null;
  if (rt.type === "blocks") return `${rt.value} blocks`;
  return `${rt.value} seconds (${Math.floor(rt.value / 512)} intervals × 512s)`;
}

function scriptTypeExplain(type: string): string {
  switch (type) {
    case "p2pkh": return "Pay-to-Public-Key-Hash: The original Bitcoin address format. Uses a public key hash and requires a signature to spend.";
    case "p2sh-p2wpkh": return "Nested SegWit: A SegWit address wrapped in a P2SH format for backwards compatibility. Wallets that don't understand SegWit can still send to these addresses.";
    case "p2sh-p2wsh": return "Nested SegWit (multisig): A more complex script (like multisig) wrapped in SegWit, then wrapped in P2SH for compatibility.";
    case "p2wpkh": return "Native SegWit (bech32): The modern address format starting with 'bc1q'. Lower fees due to the SegWit discount.";
    case "p2wsh": return "Native SegWit Script: A complex script (like multisig) using SegWit natively. Lower fees than P2SH equivalents.";
    case "p2tr_keypath": return "Taproot Key Path: The newest address format (bc1p). Spends look like a single signature, maximizing privacy and minimizing fees.";
    case "p2tr_scriptpath": return "Taproot Script Path: Uses a Taproot script branch. More complex but still benefits from Taproot's efficiency.";
    default: return "An unrecognized script type.";
  }
}

export function InputDetail({ vin, index }: InputDetailProps) {
  const timelockText = relTimelockText(vin);

  return (
    <div className="space-y-5">
      {/* Value & Type */}
      <div className="flex items-center justify-between">
        <SatsDisplay sats={vin.prevout.value_sats} className="text-xl font-semibold" />
        <ScriptBadge type={vin.script_type} />
      </div>

      {/* Plain language explanation */}
      <p className="text-sm text-foreground/70 leading-relaxed">
        This input is spending <strong className="text-foreground">{vin.prevout.value_sats.toLocaleString()} satoshis</strong> that
        were previously sent to{" "}
        {vin.address ? (
          <span className="font-mono text-xs">{vin.address.slice(0, 12)}…</span>
        ) : (
          "an unknown address"
        )}.
        Think of it as taking coins out of a previous &quot;deposit&quot; to use in this transaction.
      </p>

      <Separator />

      {/* Script Type Explanation */}
      <Accordion type="single" collapsible>
        <AccordionItem value="script-explain" className="border-0">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            What does {vin.script_type.toUpperCase()} mean?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-foreground/60 leading-relaxed">
            {scriptTypeExplain(vin.script_type)}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* Address */}
      <DetailRow
        label="Address"
        tooltip="The Bitcoin address that originally received these coins."
        explain="This is where the coins were sitting before this transaction moved them. It's like the sender's 'account'."
      >
        <AddressDisplay address={vin.address} />
      </DetailRow>

      {/* Previous TXID */}
      <DetailRow
        label="Previous Transaction"
        tooltip="The transaction ID where these coins came from."
        explain="Every input references a specific output from a previous transaction. This is the ID of that earlier transaction."
      >
        <div className="flex items-center gap-1">
          <Hash className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
          <code className="font-mono text-xs break-all">{vin.txid}</code>
          <CopyButton text={vin.txid} />
        </div>
      </DetailRow>

      {/* Output Index */}
      <DetailRow
        label="Output Index"
        tooltip="Which specific output from the previous transaction is being spent."
        explain="A transaction can have multiple outputs. This number tells which one we're spending (starting from 0)."
      >
        <span className="font-mono text-sm">#{vin.vout}</span>
      </DetailRow>

      {/* Sequence */}
      <DetailRow
        label="Sequence Number"
        tooltip="Controls RBF (Replace-By-Fee) and relative timelocks (BIP68/BIP125)."
        explain="A technical field that encodes two features: whether this transaction can be 'bumped' with a higher fee (RBF), and whether there's a waiting period before it can be confirmed."
      >
        <span className="font-mono text-sm">0x{vin.sequence.toString(16).padStart(8, "0")}</span>
      </DetailRow>

      {/* Relative Timelock */}
      {timelockText && (
        <>
          <Separator />
          <div className="flex items-start gap-2 rounded-lg bg-purple-900/20 border border-purple-800/30 p-3">
            <Clock className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-purple-300 text-sm mb-0.5">Relative Timelock</p>
              <p className="text-sm text-foreground/60 mb-1">
                This input cannot be spent until <strong>{timelockText}</strong> have passed since the referenced output was confirmed.
              </p>
              <p className="text-xs text-foreground/40">
                Think of it like a check that can only be cashed after a waiting period. This prevents the coins from being spent too quickly after they were received.
              </p>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Script Details - collapsible */}
      <Accordion type="single" collapsible>
        <AccordionItem value="scripts" className="border-0">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            Raw Script Data
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-sm text-foreground/50 leading-relaxed">
              Scripts are the Bitcoin programming language that controls how coins can be spent.
              The ScriptSig/Witness proves you&apos;re authorized to spend these coins (like a digital signature).
            </p>

            {vin.script_sig_hex && (
              <ScriptBlock label="ScriptSig (hex)" explain="The unlocking script that proves authorization to spend.">
                {vin.script_sig_hex}
              </ScriptBlock>
            )}

            {vin.script_asm && (
              <ScriptBlock label="ScriptSig (ASM)" explain="Human-readable version of the script — each word is an operation or data push.">
                {vin.script_asm}
              </ScriptBlock>
            )}

            {vin.witness.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm text-foreground/70">
                  Witness ({vin.witness.length} items)
                  <InfoTooltip text="SegWit witness data: the signature and public key are stored here separately, which is why SegWit transactions are cheaper." />
                </p>
                {vin.witness.map((w, i) => (
                  <code key={i} className="block rounded bg-background border p-2.5 font-mono text-xs break-all">
                    [{i}] {w || "(empty)"}
                  </code>
                ))}
              </div>
            )}

            {vin.witness_script_asm && (
              <ScriptBlock label="Witness Script (ASM)" explain="The actual spending conditions for P2WSH/P2SH-P2WSH scripts.">
                {vin.witness_script_asm}
              </ScriptBlock>
            )}

            <ScriptBlock label="Prevout ScriptPubKey" explain="The locking script from the previous output — defines the conditions required to spend these coins.">
              {vin.prevout.script_pubkey_hex}
            </ScriptBlock>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

