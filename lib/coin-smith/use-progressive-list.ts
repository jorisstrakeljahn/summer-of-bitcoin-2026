/**
 * Progressive list expansion hook.
 *
 * Provides paginated rendering for long lists (inputs, outputs, PSBT
 * fields). Instead of rendering all items at once — which can freeze
 * the UI for transactions with hundreds of inputs — this hook shows
 * an initial batch and lets the user expand incrementally.
 *
 * Usage:
 *   const { visible, remaining, showMore, showAll } = useProgressiveList(items);
 */

import { useState } from "react";

const INITIAL_VISIBLE = 5;
const LOAD_MORE_STEP = 10;

interface ProgressiveListResult<T> {
  visible: T[];
  remaining: number;
  showMore: () => void;
  showAll: () => void;
  needsExpansion: boolean;
}

export function useProgressiveList<T>(
  items: T[],
  initialCount = INITIAL_VISIBLE,
  step = LOAD_MORE_STEP,
): ProgressiveListResult<T> {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const needsExpansion = items.length > initialCount;
  const visible = needsExpansion ? items.slice(0, visibleCount) : items;
  const remaining = Math.max(0, items.length - visibleCount);

  function showMore() {
    setVisibleCount((prev) => Math.min(prev + step, items.length));
  }

  function showAll() {
    setVisibleCount(items.length);
  }

  return { visible, remaining, showMore, showAll, needsExpansion };
}
