/**
 * Sentiment utilities for comment analysis.
 *
 * Backend stores sentiment as integers: 1 (positive), 0 (neutral), -1 (negative).
 * sentiment_distribution keys may be lowercase English strings ("positive"/"neutral"/"negative")
 * from new analyses, or legacy Chinese strings ("正面"/"中性"/"负面") from older data.
 *
 * All display uses English; this module is the single source of truth for mapping.
 */

export type SentimentValue = 1 | 0 | -1 | number | string | undefined | null

const LABEL_MAP: Record<string | number, string> = {
  // integers
  1: "Positive",
  0: "Neutral",
  "-1": "Negative",
  // lowercase English (new backend)
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  // legacy Chinese (old data)
  "正面": "Positive",
  "中性": "Neutral",
  "负面": "Negative",
}

const INT_MAP: Record<string, number> = {
  positive: 1,
  neutral: 0,
  negative: -1,
  "正面": 1,
  "中性": 0,
  "负面": -1,
}

/** Returns English display label: "Positive", "Neutral", or "Negative". */
export function sentimentLabel(value: SentimentValue): string {
  if (value === null || value === undefined || value === "") return "Neutral"
  const key = typeof value === "number" ? value : String(value).toLowerCase().trim()
  return LABEL_MAP[key] ?? LABEL_MAP[String(value)] ?? "Neutral"
}

/** Returns the integer sentiment value (-1/0/1) from any representation. */
export function sentimentInt(value: SentimentValue): number {
  if (typeof value === "number") return value
  if (value === null || value === undefined) return 0
  const s = String(value).toLowerCase().trim()
  return INT_MAP[s] ?? INT_MAP[String(value)] ?? 0
}

/** Returns a hex color for use in inline styles. */
export function sentimentColor(value: SentimentValue): string {
  const n = sentimentInt(value)
  if (n === 1) return "#10b981"  // emerald-500
  if (n === -1) return "#f43f5e" // rose-500
  return "#94a3b8"               // slate-400
}

/** Tailwind class pairs for badges (bg + text). */
export function sentimentBadgeClass(value: SentimentValue): string {
  const n = sentimentInt(value)
  if (n === 1) return "bg-emerald-50 text-emerald-600"
  if (n === -1) return "bg-rose-50 text-rose-600"
  return "bg-slate-100 text-slate-500"
}
