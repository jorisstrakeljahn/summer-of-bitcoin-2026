/**
 * Runs all test-*.ts files and prints a summary.
 *
 * Usage: npm test
 */

import { readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { summary } from "./helpers.js";

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir).filter(f => f.startsWith("test-") && f.endsWith(".ts")).sort();

for (const f of files) await import(resolve(dir, f));

process.exit(summary() ? 0 : 1);
