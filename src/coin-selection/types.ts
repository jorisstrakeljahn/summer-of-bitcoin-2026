import type { Utxo, Payment, ChangeTemplate, CoinSelectionResult } from "../types.js";

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
