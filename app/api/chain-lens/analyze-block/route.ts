import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const PROJECT_ROOT = join(process.cwd(), "challenge-1-chain-lens");
const SESSIONS_DIR = join(PROJECT_ROOT, "tmp", "block-sessions");

function cleanOldSessions() {
  if (!existsSync(SESSIONS_DIR)) return;
  try {
    const entries = readdirSync(SESSIONS_DIR);
    for (const entry of entries) {
      const dir = join(SESSIONS_DIR, entry);
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

export async function POST(request: Request) {
  cleanOldSessions();

  const sessionId = randomUUID();
  const sessionDir = join(SESSIONS_DIR, sessionId);
  const outDir = join(sessionDir, "out");

  try {
    const formData = await request.formData();
    const blkFile = formData.get("blk") as File | null;
    const revFile = formData.get("rev") as File | null;
    const xorFile = formData.get("xor") as File | null;

    if (!blkFile || !revFile || !xorFile) {
      return Response.json(
        { ok: false, error: { code: "MISSING_FILES", message: "All three files (blk.dat, rev.dat, xor.dat) are required" } },
        { status: 400 },
      );
    }

    mkdirSync(sessionDir, { recursive: true });

    const blkPath = join(sessionDir, "blk.dat");
    const revPath = join(sessionDir, "rev.dat");
    const xorPath = join(sessionDir, "xor.dat");

    writeFileSync(blkPath, Buffer.from(await blkFile.arrayBuffer()));
    writeFileSync(revPath, Buffer.from(await revFile.arrayBuffer()));
    writeFileSync(xorPath, Buffer.from(await xorFile.arrayBuffer()));

    execFileSync("npx", [
      "tsx",
      join(PROJECT_ROOT, "src", "cli.ts"),
      "--block",
      blkPath,
      revPath,
      xorPath,
      "--all",
    ], {
      cwd: sessionDir,
      timeout: 300_000,
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });

    mkdirSync(outDir, { recursive: true });

    const jsonFiles = readdirSync(outDir).filter((f) => f.endsWith(".json"));

    const summaries = [];
    for (const f of jsonFiles) {
      const raw = readFileSync(join(outDir, f), "utf-8");
      const txIdx = raw.indexOf(',"transactions":[');
      const statsIdx = raw.lastIndexOf(',"block_stats":{');

      if (txIdx > 0 && statsIdx > 0) {
        const summaryJson = raw.slice(0, txIdx) + raw.slice(statsIdx);
        const s = JSON.parse(summaryJson);
        summaries.push({
          block_hash: s.block_header?.block_hash ?? f.replace(".json", ""),
          block_header: s.block_header,
          tx_count: s.tx_count,
          coinbase: s.coinbase,
          block_stats: s.block_stats,
        });
      } else {
        summaries.push({
          block_hash: f.replace(".json", ""),
          block_header: null,
          tx_count: 0,
          coinbase: null,
          block_stats: null,
        });
      }
    }

    return Response.json({ ok: true, session: sessionId, blocks: summaries });
  } catch (err: unknown) {
    try { rmSync(sessionDir, { recursive: true, force: true }); } catch { /* ignore */ }
    const execErr = err as { stderr?: string; message?: string };
    const msg = execErr.message ?? "Block analysis failed";
    const shortMsg = msg.length > 500 ? msg.slice(0, 500) + "…" : msg;
    return Response.json(
      { ok: false, error: { code: "BLOCK_ANALYSIS_ERROR", message: shortMsg } },
      { status: 500 },
    );
  }
}
