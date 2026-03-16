
"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, ThumbsUp, Reply } from "lucide-react"
import { cn } from "@/lib/utils"
import { sentimentLabel, sentimentBadgeClass } from "@/lib/utils/sentiment"

const EXCLUDED_TAG_VALUES = new Set(["Unknown", "unknown", "不明", "未提及", "nan", "None"])
const PAGE_SIZE = 30

type SortKey = "info_score" | "likes" | "replies"

interface CommentListProps {
  taggedData: any[]
  personas?: { name: string }[]
}

function filterTags(tags: Record<string, string>) {
  if (!tags) return []
  return Object.entries(tags).filter(([, v]) => v && !EXCLUDED_TAG_VALUES.has(v))
}

export function CommentList({ taggedData, personas = [] }: CommentListProps) {
  const [sentimentFilter, setSentimentFilter] = useState<string>("all")
  const [personaFilter, setPersonaFilter] = useState<string>("all")
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortKey>("info_score")
  const [page, setPage] = useState(1)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const uniquePersonas = useMemo(() => {
    const names = new Set<string>()
    for (const item of taggedData) {
      if (item.persona_name && item.persona_name !== "Unknown" && item.persona_name !== "未知") {
        names.add(item.persona_name)
      }
    }
    return Array.from(names).sort()
  }, [taggedData])

  const uniqueTopics = useMemo(() => {
    const topics = new Set<string>()
    for (const item of taggedData) {
      if (item.topic && item.topic !== "Unknown" && item.topic !== "未知") {
        topics.add(item.topic)
      }
    }
    return Array.from(topics).sort()
  }, [taggedData])

  const filtered = useMemo(() => {
    let result = taggedData.filter((item) => {
      if (sentimentFilter !== "all" && sentimentLabel(item.sentiment).toLowerCase() !== sentimentFilter) return false
      if (personaFilter !== "all" && item.persona_name !== personaFilter) return false
      if (topicFilter !== "all" && item.topic !== topicFilter) return false
      return true
    })

    result = [...result].sort((a, b) => {
      if (sortBy === "info_score") return (b.info_score ?? 0) - (a.info_score ?? 0)
      if (sortBy === "likes") return (b.likes ?? 0) - (a.likes ?? 0)
      return (b.replies ?? 0) - (a.replies ?? 0)
    })

    return result
  }, [taggedData, sentimentFilter, personaFilter, topicFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  const sentimentBadge = (item: any) => (
    <span className={cn("shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase", sentimentBadgeClass(item.sentiment))}>
      {sentimentLabel(item.sentiment)}
    </span>
  )

  return (
    <section className="space-y-6">
      <div className="flex items-baseline gap-4 border-b border-indigo-100 pb-4">
        <span className="font-serif text-4xl font-light text-indigo-200">06</span>
        <div>
          <h2 className="font-serif text-2xl text-slate-900">All Comments</h2>
          <p className="text-sm text-slate-500">{filtered.length} of {taggedData.length} comments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/50 bg-white/70 backdrop-blur-sm shadow-sm p-4 space-y-3">
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
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Persona filter */}
        {uniquePersonas.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 w-16 shrink-0">Persona</span>
            <button
              onClick={() => { setPersonaFilter("all"); resetPage() }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                personaFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
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
                  personaFilter === p ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Topic filter */}
        {uniqueTopics.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 w-16 shrink-0">Topic</span>
            <button
              onClick={() => { setTopicFilter("all"); resetPage() }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                topicFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              All
            </button>
            {uniqueTopics.map((t) => (
              <button
                key={t}
                onClick={() => { setTopicFilter(t); resetPage() }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  topicFilter === t ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 w-16 shrink-0">Sort by</span>
          {([["info_score", "Info Score"], ["likes", "Likes"], ["replies", "Replies"]] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setSortBy(key); resetPage() }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                sortBy === key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {label} ↓
            </button>
          ))}
        </div>
      </div>

      {/* Comment rows */}
      <div className="space-y-2">
        {pageItems.length === 0 ? (
          <div className="rounded-xl border border-white/50 bg-white/70 p-8 text-center text-sm text-slate-400">
            No comments match the current filters.
          </div>
        ) : pageItems.map((item, i) => {
          const globalIndex = (page - 1) * PAGE_SIZE + i
          const isExpanded = expandedIndex === globalIndex
          const tags = filterTags(item.tags || {})

          return (
            <div
              key={globalIndex}
              className="rounded-xl border border-white/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden"
            >
              {/* Main row */}
              <div
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/90 transition-colors"
                onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
              >
                <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
                  {sentimentBadge(item)}
                  {item.info_score !== undefined && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-mono text-amber-600 text-center">
                      {item.info_score}/10
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm text-slate-700 leading-6",
                    !isExpanded && "line-clamp-2"
                  )}>
                    {item.body}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {item.persona_name && item.persona_name !== "Unknown" && (
                      <span className="rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-purple-600">
                        {item.persona_name}
                      </span>
                    )}
                    {item.topic && item.topic !== "Unknown" && (
                      <span className="rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-sky-600">
                        {item.topic}
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
                  </div>
                </div>

                <div className="shrink-0 text-slate-300 pt-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded: tags + reason */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
                  {item.reason && (
                    <p className="text-xs italic text-indigo-500">{item.reason}</p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(([key, value]) => (
                        <span
                          key={key}
                          className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs text-sky-600"
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
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  )
}
