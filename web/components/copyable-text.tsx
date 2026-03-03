"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CopyableTextProps {
  text: string;
  truncateLen?: number;
  className?: string;
}

function truncate(s: string, len: number): string {
  if (s.length <= len) return s;
  const half = Math.floor((len - 1) / 2);
  return `${s.slice(0, half)}…${s.slice(-half)}`;
}

export function CopyableText({ text, truncateLen = 18, className = "" }: CopyableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isTruncatable = text.length > truncateLen;
  const displayText = expanded || !isTruncatable ? text : truncate(text, truncateLen);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!isTruncatable) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`font-mono cursor-pointer hover:text-foreground transition-colors text-left ${
              expanded ? "break-all" : ""
            }`}
          >
            {displayText}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {expanded ? "Click to collapse" : "Click to show full"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {copied ? "Copied!" : "Copy"}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}
