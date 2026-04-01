/**
 * Expand controls for progressive lists.
 *
 * Renders "+N more" and "show all" buttons inside a table row or
 * standalone container. Used by InputsTable, OutputsTable, and
 * PsbtViewer to provide consistent pagination UX.
 */

import { TableCell, TableRow } from "@/components/ui/table";

interface ExpandControlsProps {
  remaining: number;
  total: number;
  step: number;
  onShowMore: () => void;
  onShowAll: () => void;
  colSpan?: number;
}

export function ExpandControls({
  remaining,
  total,
  step,
  onShowMore,
  onShowAll,
  colSpan = 4,
}: ExpandControlsProps) {
  if (remaining <= 0) return null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-2">
        <span className="inline-flex items-center gap-3">
          <button
            onClick={onShowMore}
            className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium"
          >
            +{Math.min(step, remaining)} more
          </button>
          {remaining > step && (
            <>
              <span className="text-muted-foreground text-xs">|</span>
              <button
                onClick={onShowAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                show all {total}
              </button>
            </>
          )}
        </span>
      </TableCell>
    </TableRow>
  );
}
