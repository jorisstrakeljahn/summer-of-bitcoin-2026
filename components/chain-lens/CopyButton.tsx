"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/chain-lens/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
