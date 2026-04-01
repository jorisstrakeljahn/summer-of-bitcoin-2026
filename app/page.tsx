"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Hammer,
  Shield,
  ExternalLink,
  Github,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CHALLENGES = [
  {
    slug: "chain-lens",
    number: 1,
    title: "Chain Lens",
    subtitle: "Bitcoin Transaction Parser & Visualizer",
    description:
      "Parses raw Bitcoin transactions and blocks from hex, produces structured JSON, and visualizes the data as interactive flow graphs.",
    tech: ["TypeScript", "Next.js 16", "React Flow", "shadcn/ui"],
    commits: 39,
    icon: Search,
    href: "/chain-lens",
    gradient: "from-orange-500/20 to-amber-500/10",
    accentColor: "text-orange-400",
    features: [
      "Raw hex transaction parsing with SegWit support",
      "Block file analysis (blk/rev/xor format)",
      "Script classification (P2PKH, P2SH, P2WPKH, P2WSH, P2TR)",
      "Interactive transaction flow visualization",
    ],
  },
  {
    slug: "coin-smith",
    number: 2,
    title: "Coin Smith",
    subtitle: "PSBT Transaction Builder",
    description:
      "Builds safe, unsigned Bitcoin transactions with coin selection algorithms, fee estimation, and PSBT export.",
    tech: ["TypeScript", "Next.js 16", "bitcoinjs-lib", "Vitest"],
    commits: 44,
    icon: Hammer,
    href: "/coin-smith",
    gradient: "from-blue-500/20 to-cyan-500/10",
    accentColor: "text-blue-400",
    features: [
      "Branch-and-Bound & Largest-First coin selection",
      "Fee estimation with dust detection",
      "RBF and locktime support",
      "PSBT Base64 export with privacy meter",
    ],
  },
  {
    slug: "sherlock",
    number: 3,
    title: "Sherlock",
    subtitle: "Chain Analysis Engine",
    description:
      "Analyzes Bitcoin blocks with 9 chain-analysis heuristics, generates reports, and visualizes results in an interactive dashboard.",
    tech: ["TypeScript", "Next.js 16", "Recharts", "Vitest"],
    commits: 80,
    icon: Shield,
    href: "/sherlock",
    gradient: "from-emerald-500/20 to-green-500/10",
    accentColor: "text-emerald-400",
    features: [
      "9 heuristics: CIOH, Change Detection, CoinJoin, Peeling Chain...",
      "Transaction classification & flagging",
      "Block mosaic visualization",
      "Interactive transaction flow graphs",
    ],
  },
];

export default function LandingPage() {
  const [readmeSlug, setReadmeSlug] = useState<string | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  async function openReadme(slug: string) {
    if (readmeSlug === slug) {
      setReadmeSlug(null);
      return;
    }
    setReadmeSlug(slug);
    setReadmeLoading(true);
    try {
      const res = await fetch(`/api/readme?challenge=${slug}`);
      const data = await res.json();
      setReadmeContent(data.content ?? "README not found.");
    } catch {
      setReadmeContent("Failed to load README.");
    } finally {
      setReadmeLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-24">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Three Bitcoin
              <br />
              <span className="text-primary">Development Challenges</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              From parsing raw transactions to building PSBTs to chain analysis
              with 9 heuristics — each challenge explores a different layer of
              the Bitcoin protocol.
            </p>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-foreground">163+</span> commits
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-foreground">3</span> projects
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                TypeScript &middot; Next.js
              </span>
            </div>
            <div className="mt-8">
              <a
                href="https://github.com/jorisstrakeljahn/summer-of-bitcoin-2026"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Cards */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {CHALLENGES.map((challenge) => {
            const Icon = challenge.icon;
            const isExpanded = expandedCard === challenge.slug;
            return (
              <div
                key={challenge.slug}
                className="group relative flex flex-col rounded-2xl border border-border bg-card transition-all hover:border-primary/30"
              >
                {/* Gradient top bar */}
                <div
                  className={`h-1 rounded-t-2xl bg-gradient-to-r ${challenge.gradient}`}
                />

                <div className="flex flex-1 flex-col p-6">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                        <Icon className={`h-5 w-5 ${challenge.accentColor}`} />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Challenge {challenge.number}
                        </span>
                        <h2 className="text-lg font-semibold leading-tight">
                          {challenge.title}
                        </h2>
                      </div>
                    </div>
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {challenge.commits} commits
                    </span>
                  </div>

                  {/* Subtitle + Description */}
                  <p className={`text-sm font-medium ${challenge.accentColor}`}>
                    {challenge.subtitle}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {challenge.description}
                  </p>

                  {/* Features */}
                  <button
                    onClick={() =>
                      setExpandedCard(isExpanded ? null : challenge.slug)
                    }
                    className="mt-4 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {isExpanded ? "Hide" : "Show"} features
                  </button>

                  {isExpanded && (
                    <ul className="mt-3 space-y-1.5">
                      {challenge.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <span
                            className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${challenge.accentColor} opacity-60`}
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Tech stack */}
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
                    {challenge.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={challenge.href}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Open App
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => openReadme(challenge.slug)}
                      className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      README
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* About Summer of Bitcoin */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            What is Summer of Bitcoin?
          </h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <a
                href="https://www.summerofbitcoin.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-primary"
              >
                Summer of Bitcoin
              </a>{" "}
              is a global, open-source internship program that introduces
              university students to Bitcoin development. Each year, hundreds of
              applicants go through a multi-round selection process that tests
              their ability to work with Bitcoin at the protocol level — not
              through high-level APIs, but by parsing raw transactions, building
              PSBTs from scratch, and analyzing on-chain data with real heuristics.
            </p>
            <p>
              The program is structured around a series of increasingly difficult
              coding challenges. Only those who pass all rounds are matched with a
              Bitcoin open-source project for a paid summer internship. The
              challenges are designed to mirror real contributions to projects like
              Bitcoin Core, LND, and other critical infrastructure.
            </p>
            <p>
              The three projects on this page represent my completed challenge
              submissions for the 2026 cohort. Each one was built from the ground
              up — starting with a specification, writing the core logic as a CLI
              tool, adding comprehensive test suites, and finally building
              interactive web visualizers to make the results explorable.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 text-sm font-semibold text-foreground">
                Round 1
              </div>
              <p className="text-sm text-muted-foreground">
                Parse raw Bitcoin transactions and blocks from hex. Classify
                scripts, compute fees, detect timelocks, and visualize
                everything as an interactive flow graph.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 text-sm font-semibold text-foreground">
                Round 2
              </div>
              <p className="text-sm text-muted-foreground">
                Build unsigned Bitcoin transactions from scratch. Implement
                coin selection algorithms, estimate fees, handle RBF and
                locktime, and export valid PSBTs.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 text-sm font-semibold text-foreground">
                Round 3
              </div>
              <p className="text-sm text-muted-foreground">
                Build a chain analysis engine with 9 heuristics to classify
                transactions, detect CoinJoin, peeling chains, address reuse,
                and generate detailed reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* README Modal */}
      {readmeSlug && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4 pt-16">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {CHALLENGES.find((c) => c.slug === readmeSlug)?.title} — README
              </h3>
              <button
                onClick={() => setReadmeSlug(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {readmeLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none overflow-x-auto [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-secondary [&_pre]:p-4 [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1.5 [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_a]:text-primary [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {readmeContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
          <p>
            Built by{" "}
            <a
              href="https://github.com/jorisstrakeljahn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              Joris Strakeljahn
            </a>{" "}
            as part of the{" "}
            <a
              href="https://www.summerofbitcoin.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              Summer of Bitcoin 2026
            </a>{" "}
            program.
          </p>
        </div>
      </footer>
    </div>
  );
}
