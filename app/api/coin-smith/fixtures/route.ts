/**
 * GET /api/coin-smith/fixtures — Serve bundled test fixtures.
 *
 * With ?name=<filename>: returns the content of a specific fixture
 * file from the fixtures/ directory.
 *
 * Without parameters: returns a list of all available fixture
 * filenames for the example picker in the UI.
 */

import { NextRequest, NextResponse } from "next/server";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const FIXTURES_DIR = resolve(process.cwd(), "challenge-2-coin-smith", "fixtures");

export function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");

  if (name) {
    try {
      const filePath = join(FIXTURES_DIR, name);
      const content = readFileSync(filePath, "utf-8");
      return new NextResponse(content, {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return NextResponse.json(
        { error: "Fixture not found" },
        { status: 404 },
      );
    }
  }

  try {
    const files = readdirSync(FIXTURES_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort();
    return NextResponse.json({ fixtures: files });
  } catch {
    return NextResponse.json({ fixtures: [] });
  }
}
