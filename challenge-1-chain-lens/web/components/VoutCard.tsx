import type { VoutEntry } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ScriptBadge } from "./ScriptBadge";
import { AddressDisplay } from "./AddressDisplay";
import { SatsDisplay } from "./SatsDisplay";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VoutCardProps {
  vout: VoutEntry;
}

export function VoutCard({ vout }: VoutCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Output #{vout.n}</span>
            <ScriptBadge type={vout.script_type} />
          </div>
          <SatsDisplay sats={vout.value_sats} />
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground w-16 shrink-0">Address</span>
            <AddressDisplay address={vout.address} />
          </div>

          {vout.script_type === "op_return" && (
            <>
              {vout.op_return_data_utf8 && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground w-16 shrink-0">Message</span>
                  <code className="rounded bg-secondary px-1.5 py-0.5 font-mono">
                    {vout.op_return_data_utf8}
                  </code>
                </div>
              )}
              {vout.op_return_protocol && vout.op_return_protocol !== "unknown" && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground w-16 shrink-0">Protocol</span>
                  <span className="capitalize">{vout.op_return_protocol}</span>
                </div>
              )}
            </>
          )}
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="script" className="border-0">
            <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
              Script Details
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">ScriptPubKey</p>
                <code className="block rounded bg-background p-2 font-mono text-[10px] break-all">
                  {vout.script_pubkey_hex}
                </code>
              </div>
              {vout.script_asm && (
                <div>
                  <p className="text-muted-foreground mb-0.5">Script ASM</p>
                  <code className="block rounded bg-background p-2 font-mono text-[10px] break-all">
                    {vout.script_asm}
                  </code>
                </div>
              )}
              {vout.op_return_data_hex && (
                <div>
                  <p className="text-muted-foreground mb-0.5">OP_RETURN Data (hex)</p>
                  <code className="block rounded bg-background p-2 font-mono text-[10px] break-all">
                    {vout.op_return_data_hex}
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
