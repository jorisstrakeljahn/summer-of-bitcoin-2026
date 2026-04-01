import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const PROJECT_ROOT = join(process.cwd(), "challenge-1-chain-lens");

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name || /[^a-zA-Z0-9_-]/.test(name)) {
    return Response.json(
      { ok: false, error: { code: "INVALID_INPUT", message: "Invalid fixture name" } },
      { status: 400 },
    );
  }

  const fixturePath = join(PROJECT_ROOT, "fixtures", "transactions", `${name}.json`);

  if (!existsSync(fixturePath)) {
    return Response.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Fixture not found" } },
      { status: 404 },
    );
  }

  try {
    const stdout = execFileSync("npx", ["tsx", join(PROJECT_ROOT, "src", "cli.ts"), fixturePath], {
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
  }
}
