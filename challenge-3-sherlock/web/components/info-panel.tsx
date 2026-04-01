/**
 * Context and InfoButton for showing contextual help panels across the app.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoEntry {
  title: string;
  body: ReactNode;
}

interface InfoPanelContextValue {
  open: (entry: InfoEntry) => void;
  close: () => void;
}

const InfoPanelContext = createContext<InfoPanelContextValue>({
  open: () => {},
  close: () => {},
});

export function useInfoPanel() {
  return useContext(InfoPanelContext);
}

export function InfoPanelProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<InfoEntry | null>(null);

  const open = useCallback((e: InfoEntry) => setEntry(e), []);
  const close = useCallback(() => setEntry(null), []);

  return (
    <InfoPanelContext.Provider value={{ open, close }}>
      {children}

      {entry && (
        <div
          className="fixed inset-0 z-50 lg:inset-auto lg:right-0 lg:top-14 lg:bottom-0 lg:w-[400px]"
          role="dialog"
          aria-label={entry.title}
        >
          <div
            className="absolute inset-0 bg-black/30 lg:hidden"
            onClick={close}
          />

          <div
            className={cn(
              "absolute bg-background border-l shadow-xl overflow-y-auto",
              "bottom-0 left-0 right-0 max-h-[70vh] rounded-t-lg border-t lg:rounded-none lg:border-t-0",
              "lg:inset-0 lg:max-h-none",
            )}
          >
            <div className="flex justify-center pt-2 pb-0 lg:hidden">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold">{entry.title}</h2>
              <button
                onClick={close}
                className="rounded-md p-2.5 hover:bg-accent transition-colors"
                aria-label="Close info panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-4 text-sm leading-relaxed text-foreground/90 space-y-4 sm:px-5">
              {entry.body}
            </div>
          </div>
        </div>
      )}
    </InfoPanelContext.Provider>
  );
}

interface InfoButtonProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function InfoButton({ title, children, className }: InfoButtonProps) {
  const { open } = useInfoPanel();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        open({ title, body: children });
      }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors after:absolute after:inset-[-6px] after:content-['']",
        className,
      )}
      aria-label={`Info: ${title}`}
    >
      <Info className="h-3.5 w-3.5" />
    </button>
  );
}
