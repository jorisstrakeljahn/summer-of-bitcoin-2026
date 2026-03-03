"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BuildReport } from "@/lib/core";

interface PrivacyMeterProps {
  report: BuildReport;
}

interface PrivacyCheck {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  impact: number;
}

function analyzePrivacy(report: BuildReport): { score: number; checks: PrivacyCheck[] } {
  const checks: PrivacyCheck[] = [];
  let score = 100;

  const inputAddresses = report.selected_inputs.map((i) => i.address);
  const uniqueAddresses = new Set(inputAddresses);
  const hasAddressReuse = uniqueAddresses.size < inputAddresses.length;
  checks.push({
    id: "address_reuse",
    label: "No Address Reuse",
    description: hasAddressReuse
      ? "Multiple inputs share the same address, linking them as belonging to the same wallet."
      : "All inputs use distinct addresses, reducing on-chain linkage.",
    passed: !hasAddressReuse,
    impact: 30,
  });
  if (hasAddressReuse) score -= 30;

  const changeOutput = report.outputs.find((o) => o.is_change);
  const paymentTypes = new Set(report.outputs.filter((o) => !o.is_change).map((o) => o.script_type));
  const changeTypeMismatch = changeOutput != null && !paymentTypes.has(changeOutput.script_type);
  checks.push({
    id: "change_type",
    label: "Change Type Matches Payments",
    description: changeTypeMismatch
      ? `The change output uses ${changeOutput!.script_type}, but payments use different types. This makes the change output easily identifiable.`
      : changeOutput
        ? "Change output uses the same script type as payments, making it less distinguishable."
        : "No change output — not applicable.",
    passed: !changeTypeMismatch,
    impact: 25,
  });
  if (changeTypeMismatch) score -= 25;

  const singleInput = report.selected_inputs.length === 1;
  checks.push({
    id: "single_input",
    label: "Single Input (Low Linkage)",
    description: singleInput
      ? "Only one input is used, so no cross-address linking occurs in this transaction."
      : `${report.selected_inputs.length} inputs from potentially different addresses are merged, creating on-chain links between them.`,
    passed: singleInput,
    impact: 20,
  });
  if (!singleInput) score -= 20;

  const manyInputsDifferentAddrs = report.selected_inputs.length > 5 && uniqueAddresses.size > 3;
  checks.push({
    id: "input_merging",
    label: "Limited Input Merging",
    description: manyInputsDifferentAddrs
      ? `${uniqueAddresses.size} distinct addresses are merged in this transaction, creating significant linkage between them.`
      : "The number of merged addresses is reasonable.",
    passed: !manyInputsDifferentAddrs,
    impact: 25,
  });
  if (manyInputsDifferentAddrs) score -= 25;

  return { score: Math.max(0, score), checks };
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score > 70 ? "bg-green-500" :
    score > 40 ? "bg-yellow-500" :
    "bg-red-500";

  const label =
    score > 70 ? "Good" :
    score > 40 ? "Fair" :
    "Poor";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-mono font-semibold">{score}</span>
        <span className={`text-sm font-medium ${
          score > 70 ? "text-green-400" :
          score > 40 ? "text-yellow-400" :
          "text-red-400"
        }`}>{label}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function PrivacyMeter({ report }: PrivacyMeterProps) {
  const { score, checks } = useMemo(() => analyzePrivacy(report), [report]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">Privacy Meter</h2>
        <p className="text-sm text-muted-foreground">
          Heuristic analysis of how easily an observer could identify the change output or link inputs.
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
        <ScoreBar score={score} />

        <div className="space-y-2">
          {checks.map((check) => (
            <Tooltip key={check.id}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm cursor-help">
                  <span className={`text-base ${check.passed ? "text-green-400" : "text-red-400"}`}>
                    {check.passed ? "\u2713" : "\u2717"}
                  </span>
                  <span className={check.passed ? "text-muted-foreground" : "text-foreground"}>
                    {check.label}
                  </span>
                  {!check.passed && (
                    <span className="text-xs text-red-400 font-mono ml-auto">-{check.impact}</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-sm">
                {check.description}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
