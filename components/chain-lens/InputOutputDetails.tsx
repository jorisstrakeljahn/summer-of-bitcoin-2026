import type { TransactionReport } from "@/lib/chain-lens/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VinCard } from "./VinCard";
import { VoutCard } from "./VoutCard";

interface InputOutputDetailsProps {
  report: TransactionReport;
}

export function InputOutputDetails({ report }: InputOutputDetailsProps) {
  return (
    <Tabs defaultValue="inputs">
      <TabsList>
        <TabsTrigger value="inputs">
          Inputs ({report.vin.length})
        </TabsTrigger>
        <TabsTrigger value="outputs">
          Outputs ({report.vout.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="inputs" className="space-y-3 mt-3">
        {report.vin.map((vin, i) => (
          <VinCard key={i} vin={vin} index={i} />
        ))}
      </TabsContent>

      <TabsContent value="outputs" className="space-y-3 mt-3">
        {report.vout.map((vout) => (
          <VoutCard key={vout.n} vout={vout} />
        ))}
      </TabsContent>
    </Tabs>
  );
}
