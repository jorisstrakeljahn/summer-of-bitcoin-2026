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

  if (args[0] === "--block") {
    if (args.length < 4) {
      console.log(JSON.stringify(errorJson("INVALID_ARGS", "Usage: --block <blk.dat> <rev.dat> <xor.dat>")));
      process.exit(1);
    }
    // TODO: Implement block parsing (Phase 8)
    console.log(JSON.stringify(errorJson("NOT_IMPLEMENTED", "Block parsing is not yet implemented")));
    process.exit(1);
  }

  if (args.length < 1) {
    console.log(JSON.stringify(errorJson("INVALID_ARGS", "Usage: cli <fixture.json> or cli --block <blk> <rev> <xor>")));
    process.exit(1);
  }

  try {
    const fixture: Fixture = JSON.parse(readFileSync(args[0], "utf-8"));
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

main();
