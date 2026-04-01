import { describe, it, expect } from "vitest";
import { sha256, sha256d, ripemd160, hash160, reverseBuffer } from "../../../src/lib/hash.js";

describe("Cryptographic Hash Functions", () => {
  describe("sha256", () => {
    it("hashes empty input correctly", () => {
      const result = sha256(Buffer.alloc(0));
      expect(result.toString("hex")).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      );
    });

    it("hashes 'abc' correctly", () => {
      const result = sha256(Buffer.from("abc"));
      expect(result.toString("hex")).toBe(
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      );
    });
  });

  describe("sha256d", () => {
    it("double-hashes correctly (SHA256 of SHA256)", () => {
      const result = sha256d(Buffer.from("abc"));
      const expected = sha256(sha256(Buffer.from("abc")));
      expect(result.toString("hex")).toBe(expected.toString("hex"));
    });
  });

  describe("ripemd160", () => {
    it("hashes empty input correctly", () => {
      const result = ripemd160(Buffer.alloc(0));
      expect(result.toString("hex")).toBe(
        "9c1185a5c5e9fc54612808977ee8f548b2258d31",
      );
    });
  });

  describe("hash160", () => {
    it("computes RIPEMD160(SHA256(data))", () => {
      const data = Buffer.from("abc");
      const expected = ripemd160(sha256(data));
      expect(hash160(data).toString("hex")).toBe(expected.toString("hex"));
    });

    it("returns 20-byte output", () => {
      expect(hash160(Buffer.from("test")).length).toBe(20);
    });
  });

  describe("reverseBuffer", () => {
    it("reverses byte order", () => {
      const input = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      expect(reverseBuffer(input).toString("hex")).toBe("04030201");
    });

    it("handles single byte", () => {
      const input = Buffer.from([0xff]);
      expect(reverseBuffer(input).toString("hex")).toBe("ff");
    });

    it("does not mutate original", () => {
      const input = Buffer.from([0x01, 0x02]);
      reverseBuffer(input);
      expect(input.toString("hex")).toBe("0102");
    });
  });
});
