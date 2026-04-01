/**
 * Bitcoin protocol constants.
 *
 * Single source of truth for magic numbers and thresholds used
 * throughout the PSBT builder. Values match Bitcoin Core defaults
 * and the relevant BIP specifications.
 */

/**
 * Minimum output value (sats) to avoid dust classification.
 *
 * Nodes refuse to relay transactions containing outputs below this
 * threshold. Derived from Bitcoin Core's GetDustThreshold() using
 * a minRelayTxFee of 3000 sat/kvB and a P2PKH-sized spend.
 */
export const DUST_THRESHOLD_SATS = 546;

/**
 * BIP-65 boundary between block-height and Unix-timestamp
 * interpretation of nLockTime. Values below 500M represent block
 * heights; values at or above represent seconds since epoch.
 */
export const LOCKTIME_THRESHOLD = 500_000_000;

// ── nSequence flags ────────────────────────────────────────────────
//
// nSequence serves dual purpose in Bitcoin:
//   1. BIP-125 RBF: any input with nSequence <= 0xFFFFFFFD signals
//      that the transaction may be replaced by a higher-fee version.
//   2. nLockTime enforcement: nLockTime is only checked when at least
//      one input has nSequence < 0xFFFFFFFF.

/** Final — disables RBF, relative timelocks, and nLockTime enforcement. */
export const SEQUENCE_FINAL = 0xffffffff;

/** Enables nLockTime without signaling BIP-125 RBF. */
export const SEQUENCE_LOCKTIME_ONLY = 0xfffffffe;

/** Signals BIP-125 RBF and enables nLockTime. */
export const SEQUENCE_RBF = 0xfffffffd;

/** Standard transaction version (BIP-68 relative timelocks). */
export const TX_VERSION = 2;
