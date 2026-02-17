import type { BlockReport } from "@/lib/types";
import { BlockOverview } from "./BlockOverview";
import { BlockStats } from "./BlockStats";
import { BlockTxList } from "./BlockTxList";

interface BlockResultProps {
  report: BlockReport;
}

export function BlockResult({ report }: BlockResultProps) {
  return (
    <div className="space-y-6">
      <BlockOverview report={report} />
      <BlockStats report={report} />
      <BlockTxList report={report} />
    </div>
  );
}
