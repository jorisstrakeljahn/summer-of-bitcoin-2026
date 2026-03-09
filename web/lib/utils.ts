import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatDecimal(n: number, digits = 2): string {
  return n.toFixed(digits);
}

export function truncateTxid(txid: string, chars = 8): string {
  if (txid.length <= chars * 2) return txid;
  return `${txid.slice(0, chars)}...${txid.slice(-chars)}`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 19);
}
