/**
 * CLI entry point for the Bitcoin transaction/block analyzer.
 *
 * Usage:
 *   npx tsx src/cli.ts <fixture.json>                           Transaction mode
 *   npx tsx src/cli.ts --block <blk.dat> <rev.dat> <xor.dat>   Block mode
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { analyzeTransaction } from "./analyzer.js";
import type { Fixture, ErrorReport } from "./lib/types.js";

function errorJson(code: string, message: string): ErrorReport {
  return { ok: false, error: { code, message } };
}

function main(): void {
  const args = process.argv.slice(2);

  // --- Block mode ---
  if (args[0] === "--block") {
    if (args.length < 4) {
      const err = errorJson("INVALID_ARGS", "Block mode requires: --block <blk.dat> <rev.dat> <xor.dat>");
      console.log(JSON.stringify(err));
      process.exit(1);
    }

    const [, blkFile, revFile, xorFile] = args;

    mkdirSync("out", { recursive: true });

    try {
      const blkData = readFileSync(blkFile);
      const revData = readFileSync(revFile);
      const xorKey = readFileSync(xorFile);

      // TODO: Implement block parsing
      // import { parseBlockFile } from "./lib/block-parser.js";
      // const reports = parseBlockFile(blkData, revData, xorKey);
      // for (const report of reports) {
      //   const hash = report.block_header.block_hash;
      //   writeFileSync(`out/${hash}.json`, JSON.stringify(report, null, 2));
      // }

      void blkData;
      void revData;
      void xorKey;

      const err = errorJson("NOT_IMPLEMENTED", "Block parsing is not yet implemented");
      console.log(JSON.stringify(err));
      process.exit(1);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const err = errorJson("BLOCK_PARSE_ERROR", message);
      console.log(JSON.stringify(err));
      process.exit(1);
    }
    return;
  }

  // --- Transaction mode ---
  if (args.length < 1) {
    const err = errorJson("INVALID_ARGS", "Usage: cli <fixture.json> or cli --block <blk> <rev> <xor>");
    console.log(JSON.stringify(err));
    process.exit(1);
  }

  const fixturePath = args[0];

  try {
    const fixtureRaw = readFileSync(fixturePath, "utf-8");
    const fixture: Fixture = JSON.parse(fixtureRaw);

    const result = analyzeTransaction(fixture);

    mkdirSync("out", { recursive: true });

    if (result.ok) {
      // Write to out/<txid>.json
      writeFileSync(`out/${result.txid}.json`, JSON.stringify(result, null, 2));
    }

    // Print to stdout
    console.log(JSON.stringify(result));

    process.exit(result.ok ? 0 : 1);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const err = errorJson("INVALID_TX", message);
    console.log(JSON.stringify(err));
    process.exit(1);
  }
}

main();
