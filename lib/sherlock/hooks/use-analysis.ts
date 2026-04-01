"use client";

/**
 * React hooks for analysis data: useFiles, useAnalysis, useStats, useTransactions.
 * Fetch file list, block summaries, stats, and paginated transactions from API.
 * All hooks include error state handling and response validation.
 */
import { useState, useEffect, useCallback } from "react";
import type { FileSummary, BlockSummary, StatsResponse, AnalysisSummary, TransactionsPage } from "../types";
import { DEFAULT_PAGE_SIZE } from "../constants";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export function useFiles() {
  const [files, setFiles] = useState<FileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchJson<FileSummary[]>("/api/sherlock/files")
      .then(setFiles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { files, loading, error, refetch };
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stem) return;
    setLoading(true);
    setError(null);
    fetchJson<AnalysisData>(`/api/sherlock/analysis/${stem}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [stem]);

  return { data, loading, error };
}

export function useStats(stem: string | null) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stem) return;
    setLoading(true);
    setError(null);
    fetchJson<StatsResponse>(`/api/sherlock/analysis/${stem}/stats`)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [stem]);

  return { stats, loading, error };
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
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(() => {
    if (!stem || blockIdx === null) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page), size: String(DEFAULT_PAGE_SIZE) });
    if (filters.classification) params.set("classification", filters.classification);
    if (filters.heuristic) params.set("heuristic", filters.heuristic);
    if (filters.search && filters.search.length >= 4) params.set("search", filters.search);

    fetchJson<TransactionsPage>(`/api/sherlock/analysis/${stem}/blocks/${blockIdx}/transactions?${params}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [stem, blockIdx, page, filters.classification, filters.heuristic, filters.search]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { data, loading, error };
}
