/**
 * CLI entry point for the Bitcoin transaction/block analyzer.
 *
 * Usage:
 *   npx tsx src/cli.ts <fixture.json>                           Transaction mode
 *   npx tsx src/cli.ts --block <blk.dat> <rev.dat> <xor.dat>   Block mode
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
  if (args.length < 3) {
    console.log(JSON.stringify(errorJson("INVALID_ARGS", "Usage: --block <blk.dat> <rev.dat> <xor.dat>")));
    process.exit(1);
  }

  try {
    const blkData = readFileSync(args[0]);
    const revData = readFileSync(args[1]);
    const xorKey = readFileSync(args[2]);

    mkdirSync("out", { recursive: true });

    // Process blocks one-by-one — write each JSON immediately, then free memory
    const allOk = processBlocks(blkData, revData, xorKey, (report) => {
      if (report.ok) {
        writeFileSync(`out/${report.block_header.block_hash}.json`, JSON.stringify(report));
      } else {
        console.error(JSON.stringify(report));
      }
    });

    process.exit(allOk ? 0 : 1);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(JSON.stringify(errorJson("BLOCK_PARSE_ERROR", message)));
    process.exit(1);
  }
}

main();
