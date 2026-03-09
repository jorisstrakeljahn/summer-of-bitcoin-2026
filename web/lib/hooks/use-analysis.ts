"use client";

import { useState, useEffect, useCallback } from "react";
import type { FileSummary, BlockSummary, StatsResponse, AnalysisSummary } from "../types";

export function useFiles() {
  const [files, setFiles] = useState<FileSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then(setFiles)
      .finally(() => setLoading(false));
  }, []);

  return { files, loading };
}

interface AnalysisData {
  stem: string;
  file: string;
  block_count: number;
  summary: AnalysisSummary;
  blocks: BlockSummary[];
}

export function useAnalysis(stem: string | null) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stem) return;
    setLoading(true);
    fetch(`/api/analysis/${stem}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [stem]);

  return { data, loading };
}

export function useStats(stem: string | null) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stem) return;
    setLoading(true);
    fetch(`/api/analysis/${stem}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [stem]);

  return { stats, loading };
}

interface TransactionsPage {
  block_hash: string;
  block_height: number;
  block_timestamp: number;
  total: number;
  page: number;
  size: number;
  total_pages: number;
  transactions: Array<{
    txid: string;
    heuristics: Record<string, { detected: boolean }>;
    classification: string;
  }>;
}

export function useTransactions(
  stem: string | null,
  blockIdx: number | null,
  page: number,
  filters: {
    classification?: string;
    heuristic?: string;
    search?: string;
  },
) {
  const [data, setData] = useState<TransactionsPage | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(() => {
    if (!stem || blockIdx === null) return;
    setLoading(true);

    const params = new URLSearchParams({ page: String(page), size: "50" });
    if (filters.classification) params.set("classification", filters.classification);
    if (filters.heuristic) params.set("heuristic", filters.heuristic);
    if (filters.search && filters.search.length >= 4) params.set("search", filters.search);

    fetch(`/api/analysis/${stem}/blocks/${blockIdx}/transactions?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [stem, blockIdx, page, filters.classification, filters.heuristic, filters.search]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { data, loading };
}
