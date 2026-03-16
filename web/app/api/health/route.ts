/**
 * Health check endpoint returning { ok: true } for liveness/readiness probes.
 */
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true });
}
