import type { VinEntry } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ScriptBadge } from "./ScriptBadge";
import { AddressDisplay } from "./AddressDisplay";
import { SatsDisplay } from "./SatsDisplay";
import { InfoTooltip } from "./InfoTooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VinCardProps {
  vin: VinEntry;
  index: number;
}

function relTimelockText(vin: VinEntry): string | null {
  const rt = vin.relative_timelock;
  if (!rt.enabled) return null;
  if (rt.type === "blocks") return `${rt.value} blocks`;
  return `${rt.value} seconds (${Math.floor(rt.value / 512)} intervals × 512s)`;
}

export function VinCard({ vin, index }: VinCardProps) {
  const timelockText = relTimelockText(vin);

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Input #{index}</span>
            <ScriptBadge type={vin.script_type} />
          </div>
          <SatsDisplay sats={vin.prevout.value_sats} />
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground w-16 shrink-0">Address</span>
            <AddressDisplay address={vin.address} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground w-16 shrink-0">Sequence</span>
            <span className="font-mono">0x{vin.sequence.toString(16).padStart(8, "0")}</span>
          </div>
          {timelockText && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-16 shrink-0">Timelock</span>
              <span>{timelockText}</span>
              <InfoTooltip text="A relative timelock means this input cannot be spent until a certain number of blocks or time has passed since the referenced output was confirmed." />
            </div>
          )}
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="script" className="border-0">
            <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
              Script Details
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-xs">
              {vin.script_sig_hex && (
                <div>
                  <p className="text-muted-foreground mb-0.5">ScriptSig</p>
                  <code className="block rounded bg-background p-2 font-mono text-[10px] break-all">
                    {vin.script_sig_hex}
                  </code>
                </div>
              )}
              {vin.script_asm && (
                <div>
                  <p className="text-muted-foreground mb-0.5">ScriptSig ASM</p>
                  <code className="block rounded bg-background p-2 font-mono text-[10px] break-all">
                    {vin.script_asm}
                  </code>
                </div>
              )}
              {vin.witness.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-0.5">Witness ({vin.witness.length} items)</p>
                  {vin.witness.map((w, i) => (
                    <code key={i} className="block rounded bg-background p-2 font-mono text-[10px] break-all mt-1">
                      [{i}] {w || "(empty)"}
                    </code>
                  ))}
                </div>
              )}
              {vin.witness_script_asm && (
                <div>
                  <p className="text-muted-foreground mb-0.5">Witness Script ASM</p>
                  <code className="block rounded bg-background p-2 font-mono text-[10px] break-all">
                    {vin.witness_script_asm}
                  </code>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
