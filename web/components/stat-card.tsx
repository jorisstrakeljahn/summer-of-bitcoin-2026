/**
 * Reusable stat card displaying an icon, label, primary value, and optional subtitle with info button.
 */
import { InfoButton } from "@/components/info-panel";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  info?: { title: string; body: React.ReactNode };
}

export function StatCard({ icon, label, value, subtitle, info }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm md:p-5">
      <div className="flex items-center gap-2">
        {icon}
        <p className="flex-1 text-xs font-medium text-muted-foreground">
          {label}
        </p>
        {info && (
          <InfoButton title={info.title}>{info.body}</InfoButton>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
