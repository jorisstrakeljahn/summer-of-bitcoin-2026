import type { TransactionReport } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { JsonViewer } from "./JsonViewer";
import { CopyButton } from "./CopyButton";

interface TechnicalDetailsProps {
  report: TransactionReport;
}

export function TechnicalDetails({ report }: TechnicalDetailsProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="technical">
        <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline">
          Technical Details
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Transaction ID</p>
              <CopyButton text={report.txid} />
            </div>
            <code className="block rounded bg-background border p-2 font-mono text-[10px] break-all">
              {report.txid}
            </code>
          </div>

          {report.wtxid && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Witness Transaction ID</p>
                <CopyButton text={report.wtxid} />
              </div>
              <code className="block rounded bg-background border p-2 font-mono text-[10px] break-all">
                {report.wtxid}
              </code>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-1">Full JSON Report</p>
            <JsonViewer data={report} maxHeight="70vh" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
