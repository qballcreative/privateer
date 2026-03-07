/**
 * Debug logging infrastructure for RulesEngine events and Ad Manager decisions.
 * Only active in development mode. Stores a ring buffer of log entries.
 */

export type DebugLogCategory = 'rules' | 'ads' | 'engine' | 'platform';

export interface DebugLogEntry {
  id: number;
  timestamp: number;
  category: DebugLogCategory;
  event: string;
  detail?: string;
  data?: Record<string, unknown>;
}

const MAX_ENTRIES = 200;
let nextId = 0;
const entries: DebugLogEntry[] = [];
const listeners: Set<() => void> = new Set();

export function debugLog(
  category: DebugLogCategory,
  event: string,
  detail?: string,
  data?: Record<string, unknown>
) {
  if (!import.meta.env.DEV) return;

  const entry: DebugLogEntry = {
    id: nextId++,
    timestamp: Date.now(),
    category,
    event,
    detail,
    data,
  };

  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();

  // Notify subscribers
  listeners.forEach((fn) => fn());
}

export function getDebugLogs(): readonly DebugLogEntry[] {
  return entries;
}

export function clearDebugLogs(): void {
  entries.length = 0;
  listeners.forEach((fn) => fn());
}

export function subscribeDebugLogs(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
