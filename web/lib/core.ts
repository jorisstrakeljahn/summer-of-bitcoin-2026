/**
 * Core library re-exports.
 *
 * Bridges the shared src/ library into the Next.js app via the
 * @/lib path alias. This avoids relative imports reaching outside
 * the web/ directory and keeps the boundary explicit.
 */

export { build, buildWithStrategies } from "../../src/builder";
export type { BuildResult, BuildReport, BuildError } from "../../src/types";
export type { StrategySummary } from "../../src/builder";
