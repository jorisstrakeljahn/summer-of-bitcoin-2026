import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PROJECT_ROOT = join(process.cwd(), "..");
const SESSIONS_DIR = join(PROJECT_ROOT, "tmp", "block-sessions");

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = searchParams.get("session");
  const hash = searchParams.get("hash");

  if (!session || !hash) {
    return Response.json(
      { ok: false, error: { code: "MISSING_PARAMS", message: "session and hash are required" } },
      { status: 400 },
    );
  }

  if (/[^a-zA-Z0-9-]/.test(session) || /[^a-fA-F0-9]/.test(hash)) {
    return Response.json(
      { ok: false, error: { code: "INVALID_PARAMS", message: "Invalid session or hash format" } },
      { status: 400 },
    );
  }

  const filePath = join(SESSIONS_DIR, session, "out", `${hash}.json`);

  if (!existsSync(filePath)) {
    return Response.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Block report not found. Session may have expired." } },
      { status: 404 },
    );
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    return new Response(raw, {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { ok: false, error: { code: "READ_ERROR", message: "Failed to read block report" } },
      { status: 500 },
    );
  }
}
