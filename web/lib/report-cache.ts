/**
 * In-memory cache for chain analysis reports. Loads JSON from out/ and
 * exposes getReport/listAvailableStems for API routes.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { ChainAnalysisReport } from "./types";

const cache = new Map<string, ChainAnalysisReport>();

function outDir(): string {
  return join(process.cwd(), "..", "out");
}

export function getReport(stem: string): ChainAnalysisReport {
  if (cache.has(stem)) return cache.get(stem)!;

  const filePath = join(outDir(), `${stem}.json`);
  const raw = readFileSync(filePath, "utf-8");
  const report: ChainAnalysisReport = JSON.parse(raw);
  cache.set(stem, report);
  return report;
}

export function listAvailableStems(): string[] {
  try {
    const files = readdirSync(outDir());
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();
  } catch {
    return [];
  }
}
