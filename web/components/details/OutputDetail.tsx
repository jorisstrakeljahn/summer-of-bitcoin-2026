import type { VoutEntry } from "@/lib/types";
import { ScriptBadge } from "../ScriptBadge";
import { AddressDisplay } from "../AddressDisplay";
import { SatsDisplay } from "../SatsDisplay";
import { InfoTooltip } from "../InfoTooltip";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, FileCode } from "lucide-react";

interface OutputDetailProps {
  vout: VoutEntry;
}

function scriptTypeExplain(type: string): string {
  switch (type) {
    case "p2pkh": return "Pay-to-Public-Key-Hash: The original address format (starts with '1'). Widely supported but uses more block space.";
    case "p2sh": return "Pay-to-Script-Hash: Allows complex spending conditions (like multisig). The actual script is revealed only when spending.";
    case "p2wpkh": return "Native SegWit (starts with 'bc1q'): Modern format with lower fees. The signature data is stored separately.";
    case "p2wsh": return "Native SegWit Script Hash: Like P2SH but with SegWit benefits. Used for complex scripts like multisig at lower cost.";
    case "p2tr": return "Taproot (starts with 'bc1p'): The newest format. Maximizes privacy — all spends look the same from the outside.";
    case "op_return": return "OP_RETURN: A special output used to store data on the blockchain. These coins are provably unspendable — no one can ever claim them.";
    default: return "An unrecognized script type.";
  }
}

export function OutputDetail({ vout }: OutputDetailProps) {
  const isDust = vout.value_sats < 546 && vout.script_type !== "op_return";

  return (
    <div className="space-y-5">
      {/* Value & Type */}
      <div className="flex items-center justify-between">
        <SatsDisplay sats={vout.value_sats} className="text-xl font-semibold" />
        <ScriptBadge type={vout.script_type} />
      </div>

      {/* Plain language */}
      <p className="text-sm text-foreground/70 leading-relaxed">
        {vout.script_type === "op_return" ? (
          <>This output stores data on the blockchain and is <strong className="text-foreground">unspendable</strong>. No one can ever claim these coins.</>
        ) : (
          <>
            This output sends <strong className="text-foreground">{vout.value_sats.toLocaleString()} satoshis</strong> to{" "}
            {vout.address ? (
              <span className="font-mono text-xs">{vout.address.slice(0, 12)}…</span>
            ) : (
              "an unknown address"
            )}.
            These coins will sit at this address until someone with the private key spends them in a future transaction.
          </>
        )}
      </p>

      {/* Dust Warning */}
      {isDust && (
        <div className="flex items-start gap-2 rounded-lg bg-yellow-900/20 border border-yellow-800/30 p-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-300 text-sm mb-0.5">Dust Output</p>
            <p className="text-sm text-foreground/60">
              This output holds less than 546 satoshis. It costs more in transaction fees to spend these coins
              than they&apos;re worth — like a coin that costs more to pick up than its value.
            </p>
          </div>
        </div>
      )}

      <Separator />

      {/* Script Type Explanation */}
      <Accordion type="single" collapsible>
        <AccordionItem value="script-explain" className="border-0">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            What does {vout.script_type.toUpperCase()} mean?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-foreground/60 leading-relaxed">
            {scriptTypeExplain(vout.script_type)}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* Address */}
      <DetailRow
        label="Recipient Address"
        tooltip="The Bitcoin address receiving this output."
        explain="This is where the coins are going. The owner of this address can spend them later with their private key."
      >
        <AddressDisplay address={vout.address} />
      </DetailRow>

      {/* OP_RETURN */}
      {vout.script_type === "op_return" && (
        <>
          <div className="flex items-start gap-2 rounded-lg bg-blue-900/20 border border-blue-800/30 p-3">
            <FileCode className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-300 text-sm mb-0.5">Embedded Data</p>
              <p className="text-sm text-foreground/60">
                OP_RETURN allows storing up to 80 bytes of arbitrary data in the blockchain.
                Common uses: timestamping, proof-of-existence, layer-2 protocols like Omni or Open Timestamps.
              </p>
            </div>
          </div>

          {vout.op_return_data_utf8 && (
            <DetailRow label="Message (UTF-8)" explain="The embedded data decoded as readable text.">
              <code className="rounded bg-secondary px-2 py-1 font-mono text-sm">
                {vout.op_return_data_utf8}
              </code>
            </DetailRow>
          )}

          {vout.op_return_data_hex && (
            <DetailRow label="Data (hex)" explain="The raw hexadecimal data stored in this output.">
              <code className="block rounded bg-background border p-2 font-mono text-xs break-all">
                {vout.op_return_data_hex}
              </code>
            </DetailRow>
          )}

          {vout.op_return_protocol && vout.op_return_protocol !== "unknown" && (
            <DetailRow label="Protocol" explain="The identified layer-2 protocol using this OP_RETURN.">
              <span className="capitalize text-sm">{vout.op_return_protocol}</span>
            </DetailRow>
          )}
        </>
      )}

      <Separator />

      {/* Script Details */}
      <Accordion type="single" collapsible>
        <AccordionItem value="scripts" className="border-0">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            Raw Script Data
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-sm text-foreground/50 leading-relaxed">
              The ScriptPubKey is the &quot;lock&quot; on these coins. Only someone who can provide the matching
              &quot;key&quot; (signature) can spend them in a future transaction.
            </p>

            <ScriptBlock label="ScriptPubKey (hex)" explain="The locking script in raw hexadecimal.">
              {vout.script_pubkey_hex}
            </ScriptBlock>

            {vout.script_asm && (
              <ScriptBlock label="Script (ASM)" explain="Human-readable version with Bitcoin opcodes.">
                {vout.script_asm}
              </ScriptBlock>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function DetailRow({ label, tooltip, explain, children }: {
  label: string; tooltip?: string; explain?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground/80 flex items-center gap-1">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </p>
      <div>{children}</div>
      {explain && (
        <p className="text-sm text-foreground/50 leading-relaxed">{explain}</p>
      )}
    </div>
  );
}

function ScriptBlock({ label, explain, children }: { label: string; explain?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-foreground/70">{label}</p>
      {explain && <p className="text-sm text-foreground/50">{explain}</p>}
      <code className="block rounded bg-background border p-2.5 font-mono text-xs break-all max-h-28 overflow-y-auto">
        {children}
      </code>
    </div>
  );
}
