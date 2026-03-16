/**
 * App header with title, file selector, theme toggle, and mobile sidebar trigger.
 */
"use client";

import { Search, Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { FileSummary } from "@/lib/types";

interface HeaderProps {
  files: FileSummary[];
  activeStem: string | null;
  onStemChange: (stem: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({
  files,
  activeStem,
  onStemChange,
  sidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-2.5 hover:bg-accent transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        <Search className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold tracking-tight">Sherlock</h1>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Bitcoin Chain Analysis
        </span>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={activeStem ?? ""}
          onChange={(e) => onStemChange(e.target.value)}
          className="max-w-[160px] truncate rounded-md border bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary sm:max-w-none"
        >
          {files.length === 0 && <option value="">Loading...</option>}
          {files.map((f) => (
            <option key={f.stem} value={f.stem}>
              {f.stem}.dat — {f.total_tx.toLocaleString()} txs
            </option>
          ))}
        </select>

        <button
          onClick={toggleTheme}
          className="rounded-md p-2.5 hover:bg-accent transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
