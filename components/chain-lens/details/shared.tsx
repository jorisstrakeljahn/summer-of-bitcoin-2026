/**
 * Shared UI building blocks for detail sheets (Input, Output, Tx, Fee).
 *
 * Extracted here to avoid duplicating the same layout components across
 * multiple detail files. Each component is intentionally simple — just
 * consistent label + value + optional explanation patterns.
 */

import { InfoTooltip } from "../InfoTooltip";

// ---------------------------------------------------------------------------
// DetailRow — label / value / optional tooltip + explanation
// ---------------------------------------------------------------------------

export function DetailRow({ label, tooltip, explain, children }: {
  label: string;
  tooltip?: string;
  explain?: string;
  children: React.ReactNode;
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

// ---------------------------------------------------------------------------
// ScriptBlock — monospace code block for raw script hex / ASM
// ---------------------------------------------------------------------------

export function ScriptBlock({ label, explain, children }: {
  label: string;
  explain?: string;
  children: React.ReactNode;
}) {
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

// ---------------------------------------------------------------------------
// InfoBox — icon + title + explanation block (timelocks, RBF, etc.)
// ---------------------------------------------------------------------------

export function InfoBox({ icon, title, children }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-secondary/50 border p-3">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="font-medium text-sm mb-0.5">{title}</p>
        <p className="text-sm text-foreground/60 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
