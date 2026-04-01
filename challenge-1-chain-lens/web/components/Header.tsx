import { Link } from "lucide-react";

export function Header() {
  return (
    <header className="border-b px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Chain Lens</h1>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Bitcoin Transaction Explorer
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Summer of Bitcoin 2026</span>
      </div>
    </header>
  );
}
