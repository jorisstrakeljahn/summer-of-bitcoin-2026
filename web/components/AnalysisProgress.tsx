"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AnalysisProgressProps {
  active: boolean;
  label: string;
  estimatedMs?: number;
}

export function AnalysisProgress({ active, label, estimatedMs = 8000 }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const wasActiveRef = useRef(false);

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (active) {
      wasActiveRef.current = true;
      setVisible(true);
      setProgress(0);
      startRef.current = Date.now();

      function tick() {
        const elapsed = Date.now() - startRef.current;
        const ratio = elapsed / estimatedMs;
        const simulated = Math.min(95, 100 * (1 - Math.exp(-1.8 * ratio)));
        setProgress(simulated);
        rafRef.current = requestAnimationFrame(tick);
      }

      rafRef.current = requestAnimationFrame(tick);
      return stopAnimation;
    }

    if (wasActiveRef.current) {
      wasActiveRef.current = false;
      stopAnimation();
      setProgress(100);
      const timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [active, estimatedMs, stopAnimation]);

  if (!visible) return null;

  const displayPct = Math.round(progress);

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/70">{label}</span>
        <span className="tabular-nums text-primary font-medium">{displayPct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%`, transition: "width 150ms linear" }}
        />
      </div>
    </div>
  );
}
