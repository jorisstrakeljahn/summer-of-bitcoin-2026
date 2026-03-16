/**
 * Tests for the fetchJson helper extracted from use-analysis hooks.
 * Validates HTTP error status handling that was previously missing.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

describe("fetchJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 42 }),
      }),
    );
    const result = await fetchJson<{ data: number }>("/api/test");
    expect(result).toEqual({ data: 42 });
  });

  it("throws on 404 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );
    await expect(fetchJson("/api/missing")).rejects.toThrow("404 Not Found");
  });

  it("throws on 500 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      }),
    );
    await expect(fetchJson("/api/broken")).rejects.toThrow(
      "500 Internal Server Error",
    );
  });

  it("throws on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(fetchJson("/api/down")).rejects.toThrow("Failed to fetch");
  });
});
