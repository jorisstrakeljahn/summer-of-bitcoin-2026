import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const PROJECT_ROOT = join(process.cwd(), "challenge-1-chain-lens");

export async function POST(request: Request) {
  let tmpFile: string | null = null;

  try {
    const body = await request.json();

    if (!body.raw_tx || !body.prevouts) {
      return Response.json(
        { ok: false, error: { code: "INVALID_INPUT", message: "Missing raw_tx or prevouts" } },
        { status: 400 },
      );
    }

    const tmpDir = join(PROJECT_ROOT, "tmp");
    mkdirSync(tmpDir, { recursive: true });
    tmpFile = join(tmpDir, `${randomUUID()}.json`);
    writeFileSync(tmpFile, JSON.stringify(body));

    const stdout = execFileSync("npx", ["tsx", join(PROJECT_ROOT, "src", "cli.ts"), tmpFile], {
      encoding: "utf-8",
      cwd: PROJECT_ROOT,
      timeout: 10_000,
    });

    return Response.json(JSON.parse(stdout));
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; message?: string };
    if (execErr.stdout) {
      try {
        return Response.json(JSON.parse(execErr.stdout));
      } catch { /* fall through */ }
    }
    return Response.json(
      { ok: false, error: { code: "ANALYSIS_ERROR", message: execErr.message ?? "Analysis failed" } },
      { status: 500 },
    );
  } finally {
    if (tmpFile) {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }
}
