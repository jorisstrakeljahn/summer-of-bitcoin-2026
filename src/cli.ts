/**
 * CLI entry point for the Bitcoin chain analysis engine.
 *
 * Usage:
 *   npx tsx src/cli.ts --block <blk.dat> <rev.dat> <xor.dat>
 *
 * Outputs:
 *   out/<blk_stem>.json  — machine-readable analysis report
 *   out/<blk_stem>.md    — human-readable Markdown report (Phase 4)
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { basename } from "path";
import { analyzeBlockFile } from "./chain-analyzer.js";
import { generateMarkdownReport } from "./report-markdown.js";
import type { ErrorReport } from "./lib/types.js";

function errorJson(code: string, message: string): ErrorReport {
  return { ok: false, error: { code, message } };
}

function main(): void {
  const args = process.argv.slice(2);

  if (args[0] !== "--block") {
    console.log(JSON.stringify(errorJson("INVALID_ARGS", "Usage: cli.sh --block <blk.dat> <rev.dat> <xor.dat>")));
    process.exit(1);
  }

  const fileArgs = args.slice(1);
  if (fileArgs.length < 3) {
    console.log(JSON.stringify(errorJson("INVALID_ARGS", "Block mode requires: --block <blk.dat> <rev.dat> <xor.dat>")));
    process.exit(1);
  }

  const [blkPath, revPath, xorPath] = fileArgs;

  for (const f of [blkPath, revPath, xorPath]) {
    try {
      readFileSync(f, { flag: "r" });
    } catch {
      console.log(JSON.stringify(errorJson("FILE_NOT_FOUND", `File not found: ${f}`)));
      process.exit(1);
    }
  }

  try {
    const blkData = readFileSync(blkPath);
    const revData = readFileSync(revPath);
    const xorKey = readFileSync(xorPath);

    mkdirSync("out", { recursive: true });

    const blkFilename = basename(blkPath);
    const blkStem = blkFilename.replace(/\.dat$/, "");

    process.stderr.write(`Analyzing ${blkFilename}...\n`);

    const report = analyzeBlockFile(blkData, revData, xorKey, blkFilename);

    process.stderr.write(
      `Analyzed ${report.block_count} blocks, ` +
      `${report.analysis_summary.total_transactions_analyzed} transactions, ` +
      `${report.analysis_summary.flagged_transactions} flagged\n`
    );

    const jsonPath = `out/${blkStem}.json`;
    writeFileSync(jsonPath, JSON.stringify(report));
    process.stderr.write(`Wrote ${jsonPath}\n`);

    const mdPath = `out/${blkStem}.md`;
    writeFileSync(mdPath, generateMarkdownReport(report));
    process.stderr.write(`Wrote ${mdPath}\n`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(JSON.stringify(errorJson("ANALYSIS_ERROR", message)));
    process.exit(1);
  }
}

main();
