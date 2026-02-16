/**
 * Lightweight test helpers. No external dependencies.
 */

let passed = 0;
let failed = 0;
const errors: string[] = [];

export function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`  FAIL  ${name}\n        ${msg}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, label = ""): void {
  if (actual !== expected) {
    const pre = label ? `${label}: ` : "";
    throw new Error(`${pre}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function assertThrows(fn: () => void, contains?: string): void {
  try {
    fn();
    throw new Error("expected to throw");
  } catch (e) {
    if (e instanceof Error && e.message === "expected to throw") throw e;
    if (contains && e instanceof Error && !e.message.includes(contains)) {
      throw new Error(`expected error containing "${contains}", got "${e.message}"`);
    }
  }
}

export function summary(): boolean {
  if (errors.length > 0) {
    console.log(`\n${errors.join("\n\n")}\n`);
  }
  console.log(`${passed} passed, ${failed} failed`);
  return failed === 0;
}
