/**
 * GET /api/health — Health check endpoint.
 *
 * Returns { ok: true } to confirm the web server is running.
 * Used by the grading script to verify the web UI is operational.
 */

import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true });
}
