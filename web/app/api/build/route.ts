import { NextRequest, NextResponse } from "next/server";
import { build } from "@/lib/core";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Request body is not valid JSON" } },
      { status: 400 },
    );
  }

  const result = build(body);
  return NextResponse.json(result);
}
