
"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, ThumbsUp, Reply } from "lucide-react"
import { cn } from "@/lib/utils"
import { sentimentLabel, sentimentBadgeClass } from "@/lib/utils/sentiment"

const EXCLUDED_TAG_VALUES = new Set(["Unknown", "unknown", "不明", "未提及", "nan", "None"])
const PAGE_SIZE = 30

type SortKey = "combined" | "info_score" | "likes" | "replies"

type SchemaDimension = {
  key: string
  description: string
  options: string[]
}

interface CommentListProps {
  taggedData: any[]
  personas?: { name: string }[]
  schemaSnapshot?: { dimensions: SchemaDimension[] }
}

function filterTags(tags: Record<string, string>) {
  if (!tags) return []
  return Object.entries(tags).filter(([, v]) => v && !EXCLUDED_TAG_VALUES.has(v))
}

export function CommentList({ taggedData, personas = [], schemaSnapshot }: CommentListProps) {
  const [sentimentFilter, setSentimentFilter] = useState<string>("all")
  const [personaFilter, setPersonaFilter] = useState<string>("all")
  const [dimensionFilters, setDimensionFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<SortKey>("combined")
  const [likesDiv, setLikesDiv] = useState(50)
  const [repliesDiv, setRepliesDiv] = useState(10)
  const [infoWeight, setInfoWeight] = useState(0.5)
  const [page, setPage] = useState(1)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const dimensions = schemaSnapshot?.dimensions ?? []

  const uniquePersonas = useMemo(() => {
    const names = new Set<string>()
    for (const item of taggedData) {
      if (item.persona_name && item.persona_name !== "Unknown" && item.persona_name !== "未知") {
        names.add(item.persona_name)
      }
    }
    return Array.from(names).sort()
  }, [taggedData])

  function combinedScore(item: any) {
    const eng = (item.likes ?? 0) / likesDiv + (item.replies ?? 0) / repliesDiv
    return infoWeight * (item.info_score ?? 0) + (1 - infoWeight) * eng
  }

  const filtered = useMemo(() => {
    let result = taggedData.filter((item) => {
      if (sentimentFilter !== "all" && sentimentLabel(item.sentiment).toLowerCase() !== sentimentFilter) return false
      if (personaFilter !== "all" && item.persona_name !== personaFilter) return false
      for (const [dimKey, dimVal] of Object.entries(dimensionFilters)) {
        if (dimVal !== "all" && item[dimKey] !== dimVal) return false
      }
      return true
    })

    result = [...result].sort((a, b) => {
      if (sortBy === "combined") return combinedScore(b) - combinedScore(a)
      if (sortBy === "info_score") return (b.info_score ?? 0) - (a.info_score ?? 0)
      if (sortBy === "likes") return (b.likes ?? 0) - (a.likes ?? 0)
      return (b.replies ?? 0) - (a.replies ?? 0)
    })

    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taggedData, sentimentFilter, personaFilter, dimensionFilters, sortBy, likesDiv, repliesDiv, infoWeight])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  function setDimensionFilter(key: string, value: string) {
    setDimensionFilters((prev) => ({ ...prev, [key]: value }))
    resetPage()
  }

  const formulaPreview = `score = ${infoWeight} × info + ${(1 - infoWeight).toFixed(1)} × (likes/${likesDiv} + replies/${repliesDiv})`

  const sentimentBadge = (item: any) => (
    <span className={cn("shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase", sentimentBadgeClass(item.sentiment))}>
      {sentimentLabel(item.sentiment)}
    </span>
  )

  return (
    <section className="space-y-6">
      <div className="flex items-baseline gap-4 border-b border-indigo-100 dark:border-indigo-900/50 pb-4">
        <span className="font-serif text-4xl font-light text-indigo-200">05</span>
        <div>
          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">All Comments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} of {taggedData.length} comments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm shadow-sm p-4 space-y-3">
        {/* Sentiment filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 w-16 shrink-0">Sentiment</span>
          {(["all", "positive", "neutral", "negative"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setSentimentFilter(s); resetPage() }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                sentimentFilter === s
                  ? s === "positive" ? "bg-emerald-500 text-white"
                    : s === "negative" ? "bg-rose-500 text-white"
                    : s === "neutral" ? "bg-slate-400 text-white"
                    : "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15"
              )}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Persona filter */}
        {uniquePersonas.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 w-16 shrink-0">Persona</span>
            <button
              onClick={() => { setPersonaFilter("all"); resetPage() }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                personaFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15"
              )}
            >
              All
            </button>
            {uniquePersonas.map((p) => (
              <button
                key={p}
                onClick={() => { setPersonaFilter(p); resetPage() }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  personaFilter === p ? "bg-purple-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Dimension filters */}
        {dimensions.map((dim) => {
          const validOptions = dim.options.filter(
            (o) => o && !EXCLUDED_TAG_VALUES.has(o) && taggedData.some((item) => item[dim.key] === o)
          )
          if (validOptions.length === 0) return null
          const active = dimensionFilters[dim.key] ?? "all"
          return (
            <div key={dim.key} className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 w-16 shrink-0 truncate" title={dim.description}>{dim.key}</span>
              <button
                onClick={() => setDimensionFilter(dim.key, "all")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  active === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15"
                )}
              >
                All
              </button>
              {validOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setDimensionFilter(dim.key, opt)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    active === opt ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )
        })}

        {/* Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 w-16 shrink-0">Sort by</span>
          {([
            ["combined", "Score"],
            ["info_score", "Info Score"],
            ["likes", "Likes"],
            ["replies", "Replies"],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setSortBy(key); resetPage() }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                sortBy === key ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15"
              )}
            >
              {label} ↓
            </button>
          ))}
        </div>

        {/* Ranking sliders (shown when sort = combined) */}
        {sortBy === "combined" && (
          <div className="rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 space-y-2">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>👍 ÷</span>
                <input
                  type="range" min={1} max={200} value={likesDiv}
                  onChange={(e) => { setLikesDiv(Number(e.target.value)); resetPage() }}
                  className="w-24 accent-indigo-600"
                />
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 w-8">{likesDiv}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>💬 ÷</span>
                <input
                  type="range" min={1} max={50} value={repliesDiv}
                  onChange={(e) => { setRepliesDiv(Number(e.target.value)); resetPage() }}
                  className="w-24 accent-indigo-600"
                />
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 w-8">{repliesDiv}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>⭐ weight</span>
                <input
                  type="range" min={0} max={10} value={Math.round(infoWeight * 10)}
                  onChange={(e) => { setInfoWeight(Number(e.target.value) / 10); resetPage() }}
                  className="w-24 accent-indigo-600"
                />
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 w-8">{infoWeight.toFixed(1)}</span>
              </div>
            </div>
            <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{formulaPreview}</p>
          </div>
        )}
      </div>

      {/* Comment rows */}
      <div className="space-y-2">
        {pageItems.length === 0 ? (
          <div className="rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/5 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No comments match the current filters.
          </div>
        ) : pageItems.map((item, i) => {
          const globalIndex = (page - 1) * PAGE_SIZE + i
          const isExpanded = expandedIndex === globalIndex
          const tags = filterTags(item.tags || {})

          return (
            <div
              key={globalIndex}
              className="rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
            >
              {/* Main row */}
              <div
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
                onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
              >
                <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
                  {sentimentBadge(item)}
                  {item.info_score !== undefined && (
                    <span className="rounded bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-400 text-center">
                      {item.info_score}/10
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm text-slate-700 dark:text-slate-300 leading-6",
                    !isExpanded && "line-clamp-2"
                  )}>
                    {item.body}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {item.persona_name && item.persona_name !== "Unknown" && (
                      <span className="rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-700/50 px-2 py-0.5 text-purple-600 dark:text-purple-400">
                        {item.persona_name}
                      </span>
                    )}
                    {(item.likes ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {item.likes}
                      </span>
                    )}
                    {(item.replies ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Reply className="w-3 h-3" /> {item.replies}
                      </span>
                    )}
                    {sortBy === "combined" && (
                      <span className="rounded bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 text-[10px] font-mono text-indigo-500 dark:text-indigo-400">
                        {combinedScore(item).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-slate-300 dark:text-slate-600 pt-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded: tags + reason */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-white/10 pt-3 space-y-2">
                  {item.reason && (
                    <p className="text-xs italic text-indigo-500">{item.reason}</p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(([key, value]) => (
                        <span
                          key={key}
                          className="rounded-full border border-sky-200 dark:border-sky-700/50 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-0.5 text-xs text-sky-600 dark:text-sky-400"
                        >
                          {key}: <span className="font-medium">{value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  )
}
