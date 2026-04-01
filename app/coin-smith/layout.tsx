import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CoinSmithLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg bg-card/80 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>
      {children}
    </>
  );
}
