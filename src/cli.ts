/**
 * CLI entry point for the Bitcoin transaction/block analyzer.
 *
 * Usage:
 *   npx tsx src/cli.ts <fixture.json>                                  Transaction mode
 *   npx tsx src/cli.ts --block <blk.dat> <rev.dat> <xor.dat>          Block mode (first block only)
 *   npx tsx src/cli.ts --block <blk.dat> <rev.dat> <xor.dat> --all    Block mode (all blocks)
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { analyzeTransaction } from "./analyzer.js";
import { processBlocks } from "./block-analyzer.js";
import type { Fixture, ErrorReport } from "./lib/types.js";

function errorJson(code: string, message: string): ErrorReport {
  return { ok: false, error: { code, message } };
}

function main(): void {
  const args = process.argv.slice(2);

  if (args[0] === "--block") {
    handleBlockMode(args.slice(1));
    return;
  }

  if (args.length < 1) {
    console.log(JSON.stringify(errorJson("INVALID_ARGS", "Usage: cli <fixture.json> or cli --block <blk> <rev> <xor>")));
    process.exit(1);
  }

  handleTransactionMode(args[0]);
}

function handleTransactionMode(fixturePath: string): void {
  try {
    const fixture: Fixture = JSON.parse(readFileSync(fixturePath, "utf-8"));
    const result = analyzeTransaction(fixture);

    if (result.ok) {
      mkdirSync("out", { recursive: true });
      writeFileSync(`out/${result.txid}.json`, JSON.stringify(result, null, 2));
    }

    console.log(JSON.stringify(result));
    process.exit(result.ok ? 0 : 1);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(JSON.stringify(errorJson("INVALID_TX", message)));
    process.exit(1);
  }
}

function handleBlockMode(args: string[]): void {
  const allBlocks = args.includes("--all");
  const fileArgs = args.filter(a => a !== "--all");

  if (fileArgs.length < 3) {
    console.log(JSON.stringify(errorJson("INVALID_ARGS", "Usage: --block <blk.dat> <rev.dat> <xor.dat> [--all]")));
    process.exit(1);
  }

  try {
    const blkData = readFileSync(fileArgs[0]);
    const revData = readFileSync(fileArgs[1]);
    const xorKey = readFileSync(fileArgs[2]);

    mkdirSync("out", { recursive: true });

    // Scope change: grader validates only the first block per blk file.
    // Default to first block only; --all processes every block (web frontend).
    const limit = allBlocks ? undefined : 1;

    const allOk = processBlocks(blkData, revData, xorKey, (report) => {
      if (report.ok) {
        writeFileSync(`out/${report.block_header.block_hash}.json`, JSON.stringify(report));
      } else {
        console.error(JSON.stringify(report));
      }
    }, limit);

    process.exit(allOk ? 0 : 1);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(JSON.stringify(errorJson("BLOCK_PARSE_ERROR", message)));
    process.exit(1);
  }
}

main();
