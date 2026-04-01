# Summer of Bitcoin 2026

Three Bitcoin development challenges completed as part of the [Summer of Bitcoin](https://www.summerofbitcoin.org/) 2026 program. Each challenge tackles a different layer of the Bitcoin protocol — from raw transaction parsing to PSBT construction to chain analysis.

**[View the live demo →](https://summer-of-bitcoin-2026.vercel.app)**

---

## Challenges

### 1. Chain Lens — Bitcoin Transaction Parser & Visualizer

Parse raw Bitcoin transactions and blocks from hex, produce structured JSON analysis, and visualize transaction flows as interactive graphs.

- Raw hex transaction & block parsing with full SegWit support
- Script classification (P2PKH, P2SH, P2WPKH, P2WSH, P2TR, OP_RETURN)
- Fee calculation, weight analysis, and warning detection
- Interactive flow graph visualization with React Flow

**Tech:** TypeScript, Next.js 16, @xyflow/react, shadcn/ui

📂 [`challenge-1-chain-lens/`](./challenge-1-chain-lens/)

---

### 2. Coin Smith — PSBT Transaction Builder

Build safe, unsigned Bitcoin transactions with coin selection algorithms, fee estimation, RBF/locktime support, and PSBT export.

- Branch-and-Bound & Largest-First coin selection strategies
- Fee estimation with dust threshold detection
- RBF signaling and locktime configuration
- PSBT Base64 output with privacy analysis

**Tech:** TypeScript, Next.js 16, bitcoinjs-lib, Vitest

📂 [`challenge-2-coin-smith/`](./challenge-2-coin-smith/)

---

### 3. Sherlock — Chain Analysis Engine

Analyze Bitcoin blocks with 9 chain-analysis heuristics, generate markdown & JSON reports, and explore results in an interactive dashboard.

- 9 heuristics: CIOH, Change Detection, CoinJoin, Peeling Chain, Address Reuse, Round Number, Consolidation, Self-Transfer, OP_RETURN
- Transaction classification and flagging
- Block mosaic visualization and transaction flow graphs
- Statistics with charts (fee rates, script types, heuristic distribution)

**Tech:** TypeScript, Next.js 16, Recharts, Vitest

📂 [`challenge-3-sherlock/`](./challenge-3-sherlock/)

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/jorisstrakeljahn/summer-of-bitcoin-2026.git
cd summer-of-bitcoin-2026

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page. From there, navigate to any of the three challenges.

## Project Structure

```
summer-of-bitcoin-2026/
├── challenge-1-chain-lens/     # Challenge 1 source (full git history)
├── challenge-2-coin-smith/     # Challenge 2 source (full git history)
├── challenge-3-sherlock/       # Challenge 3 source (full git history)
├── app/                        # Unified Next.js app
│   ├── page.tsx                # Landing page
│   ├── chain-lens/             # /chain-lens route
│   ├── coin-smith/             # /coin-smith route
│   ├── sherlock/               # /sherlock route
│   └── api/                    # Namespaced API routes
├── components/                 # UI components per challenge
└── lib/                        # Shared libraries per challenge
```

Each challenge directory contains the complete original source code with its full commit history, preserved via `git subtree`.

## License

MIT
