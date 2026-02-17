import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const PROJECT_ROOT = join(process.cwd(), "..");

export async function POST(request: Request) {
  const tmpId = randomUUID();
  const tmpDir = join(PROJECT_ROOT, "tmp", tmpId);
  const outDir = join(tmpDir, "out");

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

    mkdirSync(tmpDir, { recursive: true });

    const blkPath = join(tmpDir, "blk.dat");
    const revPath = join(tmpDir, "rev.dat");
    const xorPath = join(tmpDir, "xor.dat");

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
    ], {
      encoding: "utf-8",
      cwd: tmpDir,
      timeout: 30_000,
    });

    mkdirSync(outDir, { recursive: true });

    const jsonFiles = readdirSync(outDir).filter((f) => f.endsWith(".json"));
    const reports = jsonFiles.map((f) => JSON.parse(readFileSync(join(outDir, f), "utf-8")));

    return Response.json({ ok: true, blocks: reports });
  } catch (err: unknown) {
    const execErr = err as { stderr?: string; message?: string };
    return Response.json(
      { ok: false, error: { code: "BLOCK_ANALYSIS_ERROR", message: execErr.message ?? "Block analysis failed" } },
      { status: 500 },
    );
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
