import type { TransactionReport } from "@/lib/types";
import { StoryView } from "./StoryView";
import { WarningBanner } from "./WarningBanner";
import { MetricsCards } from "./MetricsCards";
import { TransactionFlow } from "./TransactionFlow";
import { SegwitSavings } from "./SegwitSavings";
import { InputOutputDetails } from "./InputOutputDetails";
import { TimelockInfo } from "./TimelockInfo";
import { TechnicalDetails } from "./TechnicalDetails";

interface TransactionResultProps {
  report: TransactionReport;
}

export function TransactionResult({ report }: TransactionResultProps) {
  return (
    <div className="space-y-6">
      <StoryView report={report} />

      {report.warnings.length > 0 && <WarningBanner warnings={report.warnings} />}

      <TransactionFlow report={report} />

      <MetricsCards report={report} />

      {report.segwit_savings && <SegwitSavings savings={report.segwit_savings} />}

      <TimelockInfo report={report} />

      <InputOutputDetails report={report} />

      <TechnicalDetails report={report} />
    </div>
  );
}
