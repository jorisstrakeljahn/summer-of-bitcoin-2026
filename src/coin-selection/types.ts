/**
 * Coin selection strategy interface.
 *
 * Each strategy receives the available UTXOs, payment targets, change
 * template, fee rate, and optional max-inputs constraint. It returns
 * a valid selection result or null if no feasible combination exists.
 */

import type { Utxo, Payment, ChangeTemplate, CoinSelectionResult } from "../types";

export interface CoinSelectionParams {
  utxos: Utxo[];
  payments: Payment[];
  change: ChangeTemplate;
  feeRate: number;
  maxInputs?: number;
}

export interface CoinSelectionStrategy {
  name: string;
  select(params: CoinSelectionParams): CoinSelectionResult | null;
}
