import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Bitcoin formatting helpers (used across multiple components)
// ---------------------------------------------------------------------------

/** Format satoshis as a locale-aware string (e.g. "1,234,567"). */
export function formatSats(sats: number): string {
  return sats.toLocaleString("en-US");
}

/** Convert satoshis to BTC string with 8 decimal places. */
export function satsToBtc(sats: number): string {
  return (sats / 1e8).toFixed(8);
}
