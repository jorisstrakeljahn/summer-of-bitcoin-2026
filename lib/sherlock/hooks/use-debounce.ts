"use client";

/**
 * Debounce hook: delays updating the returned value until the input
 * has been stable for the given delay. Reduces API calls on rapid input.
 */
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
