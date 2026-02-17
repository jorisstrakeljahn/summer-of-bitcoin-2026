import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  error: { code: string; message: string };
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-start gap-3 pt-6">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="font-medium text-destructive">{error.code}</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
