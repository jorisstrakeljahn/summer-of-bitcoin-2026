/**
 * Static help content for the analysis UI. Maps info keys (e.g. totalTransactions,
 * classificationDistribution) to title/body for tooltips and info dialogs.
 */
import type { ReactNode } from "react";

interface InfoEntry {
  title: string;
  body: ReactNode;
}

export const INFO = {
  totalTransactions: {
    title: "Total Transactions",
    body: (
      <>
        <p>
          The <strong>total number of transactions</strong> across all blocks in
          this file. Each Bitcoin block contains a varying number of
          transactions — from a single coinbase transaction in an empty block to
          over 7,000 in a full block.
        </p>
        <p>
          A <em>transaction</em> (TX) is a signed data structure that transfers
          value from one or more inputs to one or more outputs. Every transaction
          consumes previously unspent transaction outputs (UTXOs) and creates new
          ones.
        </p>
        <p className="text-xs text-muted-foreground">
          The coinbase transaction (first TX in each block) is special: it has no
          real inputs and creates new bitcoin as a block reward for the miner.
        </p>
      </>
    ),
  },

  flaggedTransactions: {
    title: "Flagged Transactions",
    body: (
      <>
        <p>
          <strong>Flagged transactions</strong> are those where at least one
          chain analysis heuristic was triggered. A higher percentage means more
          transactions exhibit recognizable spending patterns.
        </p>
        <p>
          Being "flagged" does not mean a transaction is suspicious — it simply
          means the engine detected structural patterns like change outputs,
          address reuse, or round-number payments that provide analytical
          insights.
        </p>
        <p>
          Typically 85–95% of transactions in a block are flagged, because common
          patterns like <em>Change Detection</em> and <em>Address Reuse</em>{" "}
          apply to most standard payments.
        </p>
      </>
    ),
  },

  medianFeeRate: {
    title: "Median Fee Rate",
    body: (
      <>
        <p>
          The <strong>median fee rate</strong> in satoshis per virtual byte
          (sat/vB) across all transactions in the selected scope. The fee rate
          determines how quickly a transaction gets confirmed by miners.
        </p>
        <p>
          <strong>Virtual bytes (vB)</strong> were introduced with SegWit (BIP
          141). They weight non-witness data at 4 units and witness data at 1
          unit, then divide by 4. This means SegWit transactions effectively pay
          lower fees per byte of data.
        </p>
        <p>
          The median is used instead of the mean because fee distributions are
          heavily skewed — a single high-fee transaction can drastically inflate
          the average.
        </p>
        <p className="text-xs text-muted-foreground">
          Fee formula: fee = sum(input values) - sum(output values).{" "}
          Fee rate = fee / vBytes.
        </p>
      </>
    ),
  },

  blockCount: {
    title: "Blocks",
    body: (
      <>
        <p>
          A <strong>block</strong> is a batch of transactions that has been
          validated and added to the Bitcoin blockchain. Each block references the
          previous block's hash, forming an immutable chain.
        </p>
        <p>
          Bitcoin targets one new block approximately every 10 minutes. The block
          files analyzed here (<code>blk*.dat</code>) contain consecutive blocks
          as stored by Bitcoin Core.
        </p>
        <p>
          Select individual blocks from the sidebar to explore their
          transactions, or view the overview for aggregate statistics across all
          blocks.
        </p>
      </>
    ),
  },

  classificationDistribution: {
    title: "Classification Distribution",
    body: (
      <>
        <p>
          Every transaction is assigned exactly one <strong>classification</strong>{" "}
          based on its structural properties and detected heuristics:
        </p>
        <ul className="list-disc pl-4 space-y-2 text-sm">
          <li>
            <strong>Simple Payment</strong> — A standard 1-input, 1-or-2-output
            transaction. The most common type, representing direct person-to-person
            transfers.
          </li>
          <li>
            <strong>Batch Payment</strong> — 3 or more outputs, often used by
            exchanges and payment processors to send to many recipients in one TX,
            reducing fees.
          </li>
          <li>
            <strong>Consolidation</strong> — Many inputs combined into few outputs.
            Wallets do this during low-fee periods to merge small UTXOs into
            larger ones, reducing future transaction costs.
          </li>
          <li>
            <strong>CoinJoin</strong> — A privacy technique where multiple users
            combine their inputs and create equal-value outputs, making it
            difficult to trace which input funded which output.
          </li>
          <li>
            <strong>Self Transfer</strong> — All outputs use the same script type
            as the inputs, suggesting the sender and receiver are the same entity
            (e.g., moving funds between own wallets).
          </li>
          <li>
            <strong>Unknown</strong> — Cannot be classified (e.g., coinbase
            transactions).
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          Priority order: CoinJoin → Consolidation → Self Transfer → Batch → Simple → Unknown
        </p>
      </>
    ),
  },

  feeRateDistribution: {
    title: "Fee Rate Distribution",
    body: (
      <>
        <p>
          This histogram shows how <strong>fee rates</strong> are distributed
          across blocks. Each bar represents a fee-rate bucket (e.g., "5–10
          sat/vB") and shows how many blocks have their statistical fee metrics
          (min, median, mean, max) falling into that range.
        </p>
        <p>
          Fee rates fluctuate based on network demand. During high-demand
          periods, users compete for limited block space by offering higher fees.
          The dashed vertical line marks the <strong>median</strong> fee rate.
        </p>
        <p>
          Understanding fee distributions helps identify network congestion
          patterns and optimal transaction timing.
        </p>
      </>
    ),
  },

  heuristicDetections: {
    title: "Heuristic Detections",
    body: (
      <>
        <p>
          <strong>Heuristics</strong> are rule-based analysis techniques that
          identify patterns in transaction structure. They are the foundation of
          blockchain analysis — used by companies like Chainalysis and Elliptic
          to trace fund flows.
        </p>
        <p>This chart shows how often each heuristic was triggered:</p>
        <ul className="list-disc pl-4 space-y-2 text-sm">
          <li>
            <strong>CIOH</strong> (Common Input Ownership) — When a TX has
            multiple inputs, they likely belong to the same entity. This is the
            most fundamental clustering heuristic.
          </li>
          <li>
            <strong>Change Detection</strong> — Identifies which output is the
            "change" sent back to the sender. Uses script-type matching, value
            analysis, and round-number detection.
          </li>
          <li>
            <strong>Address Reuse</strong> — When the same address appears in
            both inputs and outputs, it links transactions and weakens privacy.
          </li>
          <li>
            <strong>Round Number</strong> — Payment outputs often have round BTC
            values (0.01, 0.1, 1.0 BTC), while change outputs don't.
          </li>
          <li>
            <strong>Peeling Chain</strong> — A pattern where a large UTXO is
            repeatedly "peeled" into a small payment and a large change output.
          </li>
          <li>
            <strong>OP_RETURN</strong> — Transactions with embedded data (e.g.,
            Omni Layer tokens, OpenTimestamps proofs).
          </li>
        </ul>
      </>
    ),
  },

  scriptTypeDistribution: {
    title: "Script Type Distribution",
    body: (
      <>
        <p>
          Bitcoin uses different <strong>script types</strong> to define spending
          conditions. The distribution shows which types are most prevalent:
        </p>
        <ul className="list-disc pl-4 space-y-2 text-sm">
          <li>
            <strong>P2WPKH</strong> (Pay-to-Witness-Public-Key-Hash) — Native
            SegWit addresses starting with <code>bc1q</code>. Most common today
            due to lower fees.
          </li>
          <li>
            <strong>P2TR</strong> (Pay-to-Taproot) — Taproot addresses starting
            with <code>bc1p</code>. The newest type (BIP 341), offering improved
            privacy and smart contract capabilities.
          </li>
          <li>
            <strong>P2SH</strong> (Pay-to-Script-Hash) — Used for multi-sig
            wallets and wrapped SegWit. Addresses start with <code>3</code>.
          </li>
          <li>
            <strong>P2PKH</strong> (Pay-to-Public-Key-Hash) — Legacy addresses
            starting with <code>1</code>. The original Bitcoin address format.
          </li>
          <li>
            <strong>P2WSH</strong> (Pay-to-Witness-Script-Hash) — Native SegWit
            for complex scripts like multi-sig.
          </li>
          <li>
            <strong>OP_RETURN</strong> — Not a payment type. These outputs store
            arbitrary data on the blockchain and are provably unspendable.
          </li>
        </ul>
      </>
    ),
  },

  blockMosaic: {
    title: "Block Mosaic",
    body: (
      <>
        <p>
          The <strong>Block Mosaic</strong> visualizes every transaction in the
          selected block as a small colored square. Each square's color
          represents the transaction's classification.
        </p>
        <p>
          This provides an instant visual fingerprint of a block's composition —
          a block dominated by gray (Simple Payment) squares looks very different
          from one with many purple (Self Transfer) or red (CoinJoin) squares.
        </p>
        <p>
          <strong>Hover</strong> over any square to see the transaction ID and
          classification. <strong>Click</strong> to open the interactive
          Transaction Graph for that specific transaction.
        </p>
        <p className="text-xs text-muted-foreground">
          Inspired by mempool.space's block visualizations, but colored by
          on-chain analysis classification rather than fee rate.
        </p>
      </>
    ),
  },

  transactionExplorer: {
    title: "Transaction Explorer",
    body: (
      <>
        <p>
          The <strong>Transaction Explorer</strong> lets you browse, filter, and
          inspect all transactions in the selected block.
        </p>
        <p><strong>Filters:</strong></p>
        <ul className="list-disc pl-4 space-y-1 text-sm">
          <li>
            <strong>Classification</strong> — Show only transactions of a
            specific type (e.g., only CoinJoin transactions).
          </li>
          <li>
            <strong>Heuristic</strong> — Filter by a specific detected heuristic
            (e.g., only transactions with Address Reuse).
          </li>
          <li>
            <strong>TXID Search</strong> — Search by transaction ID prefix (min
            4 characters).
          </li>
        </ul>
        <p>
          <strong>Click any row</strong> to expand it and see all detected
          heuristics with explanations. From the expanded view, you can copy the
          TXID, open it on <em>mempool.space</em>, or launch the interactive
          Transaction Graph.
        </p>
      </>
    ),
  },

  transactionGraph: {
    title: "Transaction Graph",
    body: (
      <>
        <p>
          The <strong>Transaction Graph</strong> shows the complete flow of funds
          through a single transaction. It is parsed on-the-fly from the raw
          Bitcoin block data — the same binary format Bitcoin Core stores on disk.
        </p>
        <p>
          <strong>Left side (Inputs):</strong> Each input references a previous
          transaction output (UTXO) being spent. Shows the address, value in
          satoshis, and script type. A clock icon indicates a relative timelock.
        </p>
        <p>
          <strong>Center:</strong> The transaction itself, showing SegWit status
          and version number.
        </p>
        <p>
          <strong>Right side (Outputs):</strong> New UTXOs created by this
          transaction. Shows destination address, value, and script type. Warning
          icons indicate dust outputs (&lt;546 sats), file icons indicate
          OP_RETURN data.
        </p>
        <p>
          <strong>Dashed line (Fee):</strong> The difference between total input
          and output values goes to the miner as a fee.
        </p>
        <p>
          Edge thickness is proportional to the satoshi value flowing through
          that connection.
        </p>
      </>
    ),
  },
} as const satisfies Record<string, InfoEntry>;
