import { readFileSync } from "node:fs";
import { join } from "node:path";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name || /[^a-zA-Z0-9_-]/.test(name)) {
    return Response.json({ error: "invalid name" }, { status: 400 });
  }

  try {
    const fixturePath = join(process.cwd(), "..", "fixtures", "transactions", `${name}.json`);
    const content = readFileSync(fixturePath, "utf-8");
    return Response.json(JSON.parse(content));
  } catch {
    return Response.json({ error: "fixture not found" }, { status: 404 });
  }
}
