/**
 * Sequential binary reader for parsing Bitcoin wire format data.
 *
 * Reads integers in little-endian byte order (Bitcoin standard).
 * Supports Bitcoin's CompactSize variable-length integer encoding.
 */

export class BufferReader {
  private offset = 0;

  constructor(private readonly buffer: Buffer) {}

  get position(): number {
    return this.offset;
  }

  get remaining(): number {
    return this.buffer.length - this.offset;
  }

  seek(position: number): void {
    if (position < 0 || position > this.buffer.length) {
      throw new Error(`BufferReader: seek position ${position} out of range [0, ${this.buffer.length}]`);
    }
    this.offset = position;
  }

  skip(bytes: number): void {
    this.ensureAvailable(bytes);
    this.offset += bytes;
  }

  peekUInt8(): number {
    this.ensureAvailable(1);
    return this.buffer[this.offset];
  }

  readUInt8(): number {
    this.ensureAvailable(1);
    return this.buffer[this.offset++];
  }

  readUInt16LE(): number {
    this.ensureAvailable(2);
    const val = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return val;
  }

  readUInt32LE(): number {
    this.ensureAvailable(4);
    const val = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return val;
  }

  readInt32LE(): number {
    this.ensureAvailable(4);
    const val = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return val;
  }

  readUInt64LE(): bigint {
    this.ensureAvailable(8);
    const val = this.buffer.readBigUInt64LE(this.offset);
    this.offset += 8;
    return val;
  }

  readSlice(length: number): Buffer {
    this.ensureAvailable(length);
    const slice = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  /**
   * Read a Bitcoin CompactSize unsigned integer.
   *
   * Encoding:
   *   0x00–0xFC  → 1 byte  (value is the byte itself)
   *   0xFD       → 3 bytes (0xFD + 2-byte LE uint16)
   *   0xFE       → 5 bytes (0xFE + 4-byte LE uint32)
   *   0xFF       → 9 bytes (0xFF + 8-byte LE uint64)
   */
  readCompactSize(): number {
    const first = this.readUInt8();
    if (first < 0xfd) return first;
    if (first === 0xfd) return this.readUInt16LE();
    if (first === 0xfe) return this.readUInt32LE();

    const val = this.readUInt64LE();
    if (val > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error("CompactSize value exceeds safe integer range");
    }
    return Number(val);
  }

  private ensureAvailable(bytes: number): void {
    if (this.offset + bytes > this.buffer.length) {
      throw new Error(
        `BufferReader: attempt to read ${bytes} bytes at offset ${this.offset}, ` +
        `but buffer is only ${this.buffer.length} bytes`
      );
    }
  }
}

export function compactSizeLength(value: number): number {
  if (value < 0xfd) return 1;
  if (value <= 0xffff) return 3;
  if (value <= 0xffffffff) return 5;
  return 9;
}
