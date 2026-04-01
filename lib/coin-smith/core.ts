/**
 * Core library re-exports.
 *
 * Bridges the shared src/ library into the Next.js app via the
 * @/lib path alias. This avoids relative imports reaching outside
 * the web/ directory and keeps the boundary explicit.
 */

export { build, buildWithStrategies } from "@coin-smith/builder";
export type { BuildResult, BuildReport, BuildError } from "@coin-smith/types";
export type { StrategySummary } from "@coin-smith/builder";
