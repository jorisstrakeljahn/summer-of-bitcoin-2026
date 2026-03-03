import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename } from "node:path";
import { build } from "./builder";

function main(): void {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    const error = {
      ok: false,
      error: { code: "INVALID_ARGS", message: "Usage: cli.sh <fixture.json>" },
    };
    process.stderr.write("Error: No fixture file provided\n");
    process.stdout.write(JSON.stringify(error) + "\n");
    process.exit(1);
  }

  const fixturePath = args[0];
  const fixtureName = basename(fixturePath);
  const outputDir = "out";
  const outputPath = `${outputDir}/${fixtureName}`;

  mkdirSync(outputDir, { recursive: true });

  let rawJson: unknown;
  try {
    const content = readFileSync(fixturePath, "utf-8");
    rawJson = JSON.parse(content);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const error = {
      ok: false,
      error: { code: "INVALID_FIXTURE", message: `Failed to read fixture: ${message}` },
    };
    writeFileSync(outputPath, JSON.stringify(error, null, 2));
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }

  const result = build(rawJson);
  writeFileSync(outputPath, JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.stderr.write(`Error: ${result.error.message}\n`);
    process.exit(1);
  }
}

main();
