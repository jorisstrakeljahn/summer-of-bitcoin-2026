import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

const CHALLENGES: Record<string, string> = {
  "chain-lens": "challenge-1-chain-lens",
  "coin-smith": "challenge-2-coin-smith",
  sherlock: "challenge-3-sherlock",
};

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("challenge");
  if (!slug || !CHALLENGES[slug]) {
    return NextResponse.json({ error: "Invalid challenge" }, { status: 400 });
  }

  try {
    const readmePath = join(process.cwd(), CHALLENGES[slug], "README.md");
    const content = readFileSync(readmePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "README not found" }, { status: 404 });
  }
}
