/**
 * CLI entry point for the Bitcoin chain analysis engine.
 *
 * Usage:
 *   npx tsx src/cli.ts --block <blk.dat> <rev.dat> <xor.dat>
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { basename } from "path";
import { iterateBlocks, extractBip34Height } from "./lib/block-parser.js";
import { computeTxid } from "./lib/tx-serializer.js";
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

    let blockCount = 0;
    let totalTx = 0;

    for (const { block, undo } of iterateBlocks(blkData, revData, xorKey)) {
      blockCount++;
      const height = extractBip34Height(block);
      const txCount = block.transactions.length;
      totalTx += txCount;

      const firstTxid = computeTxid(block.transactions[0]);
      process.stderr.write(
        `Block ${blockCount}: hash=${block.header.blockHash.slice(0, 16)}... ` +
        `height=${height} txs=${txCount} coinbase=${firstTxid.slice(0, 16)}...\n`
      );
    }

    process.stderr.write(`\nParsed ${blockCount} blocks, ${totalTx} total transactions from ${blkFilename}\n`);

    // TODO: Replace with full chain analysis pipeline
    console.log(JSON.stringify(errorJson("NOT_IMPLEMENTED", "Chain analysis pipeline not yet complete")));
    process.exit(1);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(JSON.stringify(errorJson("BLOCK_PARSE_ERROR", message)));
    process.exit(1);
  }
}

main();
