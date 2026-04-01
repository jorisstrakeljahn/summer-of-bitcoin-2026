/**
 * POST /api/analyze — Accepts blk.dat, rev.dat, and xor.dat via FormData,
 * runs the chain analysis pipeline, persists both raw files and the JSON
 * report, then returns the stem for the newly available dataset.
 */
import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { analyzeBlockFile } from "@sherlock/chain-analyzer";
import { invalidateReport } from "@/lib/report-cache";
import { invalidateBlockData } from "@/lib/block-cache";

function fixturesDir(): string {
  return join(process.cwd(), "..", "fixtures");
}

function outDir(): string {
  return join(process.cwd(), "..", "out");
}

function deriveStem(filename: string): string {
  const name = filename.replace(/\.dat$/i, "");
  if (/^blk\d+$/.test(name)) return name;
  return `blk-upload-${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const blkFile = formData.get("blk") as File | null;
    const revFile = formData.get("rev") as File | null;
    const xorFile = formData.get("xor") as File | null;

    if (!blkFile || !revFile || !xorFile) {
      return NextResponse.json(
        { ok: false, error: "All three files (blk.dat, rev.dat, xor.dat) are required." },
        { status: 400 },
      );
    }

    const stem = deriveStem(blkFile.name);
    const suffix = stem.replace("blk", "");

    const blkData = Buffer.from(await blkFile.arrayBuffer());
    const revData = Buffer.from(await revFile.arrayBuffer());
    const xorData = Buffer.from(await xorFile.arrayBuffer());

    const fixtures = fixturesDir();
    mkdirSync(fixtures, { recursive: true });
    writeFileSync(join(fixtures, `blk${suffix}.dat`), blkData);
    writeFileSync(join(fixtures, `rev${suffix}.dat`), revData);
    writeFileSync(join(fixtures, "xor.dat"), xorData);

    const report = analyzeBlockFile(blkData, revData, xorData, `${stem}.dat`);

    const out = outDir();
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, `${stem}.json`), JSON.stringify(report, null, 2));

    invalidateReport(stem);
    invalidateBlockData(stem);

    return NextResponse.json({
      ok: true,
      stem,
      block_count: report.block_count,
      total_tx: report.analysis_summary.total_transactions_analyzed,
      flagged: report.analysis_summary.flagged_transactions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
