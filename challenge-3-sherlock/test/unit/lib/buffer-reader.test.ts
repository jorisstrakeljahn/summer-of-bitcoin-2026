import { describe, it, expect } from "vitest";
import { BufferReader, compactSizeLength } from "../../../src/lib/buffer-reader.js";

describe("BufferReader", () => {
  it("reads UInt8 and advances position", () => {
    const reader = new BufferReader(Buffer.from([0x42, 0xff]));
    expect(reader.readUInt8()).toBe(0x42);
    expect(reader.position).toBe(1);
    expect(reader.readUInt8()).toBe(0xff);
  });

  it("reads UInt32LE correctly", () => {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(0xdeadbeef);
    const reader = new BufferReader(buf);
    expect(reader.readUInt32LE()).toBe(0xdeadbeef);
  });

  it("reads UInt16LE correctly", () => {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(0x1234);
    const reader = new BufferReader(buf);
    expect(reader.readUInt16LE()).toBe(0x1234);
  });

  it("reads UInt64LE correctly", () => {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(123456789n);
    const reader = new BufferReader(buf);
    expect(reader.readUInt64LE()).toBe(123456789n);
  });

  it("tracks remaining bytes", () => {
    const reader = new BufferReader(Buffer.alloc(10));
    expect(reader.remaining).toBe(10);
    reader.skip(3);
    expect(reader.remaining).toBe(7);
  });

  it("reads slices without copying data", () => {
    const buf = Buffer.from([1, 2, 3, 4, 5]);
    const reader = new BufferReader(buf);
    const slice = reader.readSlice(3);
    expect(slice.toString("hex")).toBe("010203");
    expect(reader.position).toBe(3);
  });

  it("peeks without advancing", () => {
    const reader = new BufferReader(Buffer.from([0x42]));
    expect(reader.peekUInt8()).toBe(0x42);
    expect(reader.position).toBe(0);
  });

  it("seeks to specific position", () => {
    const reader = new BufferReader(Buffer.alloc(10));
    reader.seek(5);
    expect(reader.position).toBe(5);
  });

  it("throws on out-of-range seek", () => {
    const reader = new BufferReader(Buffer.alloc(5));
    expect(() => reader.seek(10)).toThrow("out of range");
  });

  it("throws on read past end of buffer", () => {
    const reader = new BufferReader(Buffer.alloc(2));
    expect(() => reader.readUInt32LE()).toThrow();
  });

  describe("readCompactSize", () => {
    it("reads single-byte values (< 0xFD)", () => {
      const reader = new BufferReader(Buffer.from([0x05]));
      expect(reader.readCompactSize()).toBe(5);
    });

    it("reads 2-byte values (0xFD prefix)", () => {
      const buf = Buffer.from([0xfd, 0x00, 0x01]); // 256
      const reader = new BufferReader(buf);
      expect(reader.readCompactSize()).toBe(256);
    });

    it("reads 4-byte values (0xFE prefix)", () => {
      const buf = Buffer.alloc(5);
      buf[0] = 0xfe;
      buf.writeUInt32LE(70_000, 1);
      const reader = new BufferReader(buf);
      expect(reader.readCompactSize()).toBe(70_000);
    });
  });
});

describe("compactSizeLength", () => {
  it("returns 1 for values < 0xFD", () => {
    expect(compactSizeLength(0)).toBe(1);
    expect(compactSizeLength(252)).toBe(1);
  });

  it("returns 3 for values up to 0xFFFF", () => {
    expect(compactSizeLength(253)).toBe(3);
    expect(compactSizeLength(65535)).toBe(3);
  });

  it("returns 5 for values up to 0xFFFFFFFF", () => {
    expect(compactSizeLength(65536)).toBe(5);
    expect(compactSizeLength(0xffffffff)).toBe(5);
  });
});
