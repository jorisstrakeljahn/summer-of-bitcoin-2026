import type { Fixture, RbfLocktimeResult } from "./types.js";

const SEQUENCE_FINAL = 0xffffffff;
const SEQUENCE_LOCKTIME_ENABLED = 0xfffffffe;
const SEQUENCE_RBF = 0xfffffffd;
const LOCKTIME_THRESHOLD = 500_000_000;

export function computeRbfLocktime(fixture: Fixture): RbfLocktimeResult {
  const rbf = fixture.rbf === true;
  const hasLocktime = fixture.locktime !== undefined;
  const hasCurrentHeight = fixture.current_height !== undefined;

  let nSequence: number;
  let nLockTime: number;

  if (rbf) {
    nSequence = SEQUENCE_RBF;

    if (hasLocktime) {
      nLockTime = fixture.locktime!;
    } else if (hasCurrentHeight) {
      nLockTime = fixture.current_height!;
    } else {
      nLockTime = 0;
    }
  } else if (hasLocktime) {
    nSequence = SEQUENCE_LOCKTIME_ENABLED;
    nLockTime = fixture.locktime!;
  } else {
    nSequence = SEQUENCE_FINAL;
    nLockTime = 0;
  }

  const rbfSignaling = nSequence <= SEQUENCE_RBF;

  let locktimeType: RbfLocktimeResult["locktimeType"];
  if (nLockTime === 0) {
    locktimeType = "none";
  } else if (nLockTime < LOCKTIME_THRESHOLD) {
    locktimeType = "block_height";
  } else {
    locktimeType = "unix_timestamp";
  }

  return { nSequence, nLockTime, rbfSignaling, locktimeType };
}
