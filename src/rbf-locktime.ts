/**
 * RBF signaling and locktime resolution.
 *
 * Determines nSequence (per input) and nLockTime for the unsigned
 * transaction based on the fixture's `rbf`, `locktime`, and
 * `current_height` fields.
 *
 * Follows Bitcoin Core's wallet behavior and the interaction matrix
 * from BIP-125 (Replace-By-Fee) and BIP-65 (CHECKLOCKTIMEVERIFY):
 *
 *   ┌───────────────┬──────────────────┬────────────────┬────────────┬───────────┐
 *   │ rbf           │ locktime present │ current_height │ nSequence  │ nLockTime │
 *   ├───────────────┼──────────────────┼────────────────┼────────────┼───────────┤
 *   │ false/absent  │ no               │ —              │ 0xFFFFFFFF │ 0         │
 *   │ false/absent  │ yes              │ —              │ 0xFFFFFFFE │ locktime  │
 *   │ true          │ no               │ yes            │ 0xFFFFFFFD │ height    │
 *   │ true          │ yes              │ —              │ 0xFFFFFFFD │ locktime  │
 *   │ true          │ no               │ no             │ 0xFFFFFFFD │ 0         │
 *   └───────────────┴──────────────────┴────────────────┴────────────┴───────────┘
 *
 * Row 3 implements anti-fee-sniping: when RBF is enabled and no
 * explicit locktime is set, Bitcoin Core sets nLockTime = current_height
 * to prevent miners from re-mining old transactions at a profit.
 */

import type { Fixture, RbfLocktimeResult } from "./types";
import {
  SEQUENCE_FINAL,
  SEQUENCE_LOCKTIME_ONLY,
  SEQUENCE_RBF,
  LOCKTIME_THRESHOLD,
} from "./constants";

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
    nSequence = SEQUENCE_LOCKTIME_ONLY;
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
