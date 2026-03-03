import { describe, it, expect } from "vitest";
import { computeRbfLocktime } from "../src/rbf-locktime.js";
import { makeFixture } from "./helpers.js";

describe("computeRbfLocktime", () => {
  it("row 1: defaults to final sequence and no locktime", () => {
    const result = computeRbfLocktime(makeFixture({}));

    expect(result.nSequence).toBe(0xffffffff);
    expect(result.nLockTime).toBe(0);
    expect(result.rbfSignaling).toBe(false);
    expect(result.locktimeType).toBe("none");
  });

  it("row 2: enables locktime without rbf signaling", () => {
    const result = computeRbfLocktime(makeFixture({ locktime: 850_000 }));

    expect(result.nSequence).toBe(0xfffffffe);
    expect(result.nLockTime).toBe(850_000);
    expect(result.rbfSignaling).toBe(false);
    expect(result.locktimeType).toBe("block_height");
  });

  it("row 3: anti-fee-sniping sets locktime to current_height", () => {
    const result = computeRbfLocktime(
      makeFixture({ rbf: true, current_height: 860_000 }),
    );

    expect(result.nSequence).toBe(0xfffffffd);
    expect(result.nLockTime).toBe(860_000);
    expect(result.rbfSignaling).toBe(true);
    expect(result.locktimeType).toBe("block_height");
  });

  it("row 4: rbf with explicit locktime uses locktime value", () => {
    const result = computeRbfLocktime(
      makeFixture({ rbf: true, locktime: 850_000 }),
    );

    expect(result.nSequence).toBe(0xfffffffd);
    expect(result.nLockTime).toBe(850_000);
    expect(result.rbfSignaling).toBe(true);
    expect(result.locktimeType).toBe("block_height");
  });

  it("row 5: rbf without locktime or height sets locktime to zero", () => {
    const result = computeRbfLocktime(makeFixture({ rbf: true }));

    expect(result.nSequence).toBe(0xfffffffd);
    expect(result.nLockTime).toBe(0);
    expect(result.rbfSignaling).toBe(true);
    expect(result.locktimeType).toBe("none");
  });

  it("classifies locktime 499999999 as block_height (boundary)", () => {
    const result = computeRbfLocktime(makeFixture({ locktime: 499_999_999 }));

    expect(result.nLockTime).toBe(499_999_999);
    expect(result.locktimeType).toBe("block_height");
  });

  it("classifies locktime 500000000 as unix_timestamp (boundary)", () => {
    const result = computeRbfLocktime(makeFixture({ locktime: 500_000_000 }));

    expect(result.nLockTime).toBe(500_000_000);
    expect(result.locktimeType).toBe("unix_timestamp");
  });

  it("explicit rbf:false with locktime enables locktime without rbf", () => {
    const result = computeRbfLocktime(
      makeFixture({ rbf: false, locktime: 900_000 }),
    );

    expect(result.nSequence).toBe(0xfffffffe);
    expect(result.nLockTime).toBe(900_000);
    expect(result.rbfSignaling).toBe(false);
    expect(result.locktimeType).toBe("block_height");
  });

  it("rbf:true with locktime ignores current_height", () => {
    const result = computeRbfLocktime(
      makeFixture({ rbf: true, locktime: 850_000, current_height: 860_000 }),
    );

    expect(result.nLockTime).toBe(850_000);
  });
});
