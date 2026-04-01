/**
 * Lightweight test helpers — human-readable output, no dependencies.
 */

let passed = 0;
let failed = 0;
const errors: string[] = [];

/** Group related tests under a visible section header. */
export function describe(label: string, fn: () => void): void {
  console.log(`\n  ${label}`);
  fn();
}

export function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`    ✓ ${name}`);
  } catch (e) {
    failed++;
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`    ✗ ${name}\n      ${msg}`);
    console.log(`    ✗ ${name}`);
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
  console.log("");
  if (errors.length > 0) {
    console.log("  Failures:\n");
    console.log(errors.join("\n\n"));
    console.log("");
  }
  const total = passed + failed;
  console.log(`  ${total} tests — ${passed} passed, ${failed} failed`);
  return failed === 0;
}
