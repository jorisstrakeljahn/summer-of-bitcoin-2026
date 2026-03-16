/**
 * Reusable loading spinner with configurable size ("sm" | "md" | "lg").
 */

const SIZE_CLASSES = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

interface SpinnerProps {
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
