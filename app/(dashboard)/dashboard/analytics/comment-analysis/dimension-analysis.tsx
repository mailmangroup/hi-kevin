
"use client"

import { useMemo, useState } from "react"
import { ChevronRight, ChevronDown, SlidersHorizontal, ArrowLeft } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import { sentimentLabel, sentimentColor, sentimentInt } from "@/lib/utils/sentiment"

const EXCLUDED_TAG_VALUES = new Set(["Unknown", "unknown", "不明", "未提及", "nan", "None", "其他", "other", ""])

type SchemaDimension = {
  key: string
  description: string
  options: string[]
}

interface DimensionAnalysisProps {
  taggedData: any[]
  sentimentDistribution: Record<string, number>
  schemaSnapshot: {
    dimensions: SchemaDimension[]
  }
}

type SortMode = "count" | "score"

type DimensionSummary = {
  key: string
  description: string
  options: string[]
  count: number
  sentimentBreakdown: Record<string, number>
}

type OptionStats = {
  option: string
  count: number
  likes: number
  replies: number
  score: number
  comments: any[]
  sentimentBreakdown: Record<string, number>
}

export function DimensionAnalysis({ taggedData, sentimentDistribution, schemaSnapshot }: DimensionAnalysisProps) {
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null)
  const [expandedOption, setExpandedOption] = useState<string | null>(null)
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>("score")
  const [showWeights, setShowWeights] = useState(false)
  const [weights, setWeights] = useState({
    comment: 1,
    like: 0.3,
    reply: 0.5,
  })

  // Level 1: Dimension summaries
  const dimensionSummaries = useMemo<DimensionSummary[]>(() => {
    return schemaSnapshot.dimensions.map((dim) => {
      let count = 0
      const sentimentBreakdown: Record<string, number> = {}

      taggedData.forEach((item) => {
        const val = item.tags?.[dim.key]
        if (!val || EXCLUDED_TAG_VALUES.has(val)) return
        count++
        const sent = sentimentLabel(item.sentiment)
        sentimentBreakdown[sent] = (sentimentBreakdown[sent] || 0) + 1
      })

      return {
        key: dim.key,
        description: dim.description,
        options: dim.options,
        count,
        sentimentBreakdown,
      }
    })
  }, [taggedData, schemaSnapshot])

  // Level 2: Option stats for selected dimension
  const optionStats = useMemo<OptionStats[]>(() => {
    if (!selectedDimension) return []

    const stats: Record<string, OptionStats> = {}

    taggedData.forEach((item) => {
      if (selectedSentiment && sentimentInt(item.sentiment) !== sentimentInt(selectedSentiment)) return

      const val = item.tags?.[selectedDimension]
      if (!val || EXCLUDED_TAG_VALUES.has(val)) return

      if (!stats[val]) {
        stats[val] = { option: val, count: 0, likes: 0, replies: 0, score: 0, comments: [], sentimentBreakdown: {} }
      }

      stats[val].count += 1
      stats[val].likes += item.likes || 0
      stats[val].replies += item.replies || 0
      stats[val].comments.push(item)

      const itemScore =
        weights.comment * 1 +
        weights.like * (item.likes || 0) +
        weights.reply * (item.replies || 0)
      stats[val].score += itemScore

      const sent = sentimentLabel(item.sentiment)
      stats[val].sentimentBreakdown[sent] = (stats[val].sentimentBreakdown[sent] || 0) + 1
    })

    return Object.values(stats)
      .sort((a, b) => (sortMode === "score" ? b.score - a.score : b.count - a.count))
  }, [taggedData, selectedDimension, selectedSentiment, weights, sortMode])

  const selectedDimInfo = schemaSnapshot.dimensions.find((d) => d.key === selectedDimension)

  // ========== Level 1: Dimension List ==========
  if (!selectedDimension) {
    return (
      <section className="space-y-6">
        <div className="flex items-baseline gap-4 border-b border-indigo-100 dark:border-indigo-900/50 pb-4">
          <span className="font-serif text-4xl font-light text-indigo-200">04</span>
          <div>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">Dimension Analysis</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Categorized browsing based on {schemaSnapshot.dimensions.length} analysis dimensions
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {dimensionSummaries.map((dim) => (
            <div
              key={dim.key}
              onClick={() => {
                setSelectedDimension(dim.key)
                setExpandedOption(null)
                setSelectedSentiment(null)
              }}
              className="group relative cursor-pointer rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm shadow-sm p-5 transition-all hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {dim.key}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 line-clamp-2">{dim.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 ml-3" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {dim.count} comments · {dim.options.length} options
                </span>
                {dim.count > 0 && (
                  <div className="flex h-1.5 w-20 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    {Object.entries(dim.sentimentBreakdown).map(([sent, count]) => (
                      <div
                        key={sent}
                        style={{
                          width: `${(count / dim.count) * 100}%`,
                          background: sentimentColor(sent),
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {dim.options.slice(0, 5).map((opt) => (
                  <span
                    key={opt}
                    className="rounded-full border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-400"
                  >
                    {opt}
                  </span>
                ))}
                {dim.options.length > 5 && (
                  <span className="rounded-full border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                    +{dim.options.length - 5}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // ========== Level 2: Option Groups for Selected Dimension ==========
  return (
    <section className="space-y-6">
      <div className="flex items-baseline gap-4 border-b border-indigo-100 dark:border-indigo-900/50 pb-4">
        <span className="font-serif text-4xl font-light text-indigo-200">04</span>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedDimension(null)
                setExpandedOption(null)
                setSelectedSentiment(null)
              }}
              className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">{selectedDimension}</h2>
              {selectedDimInfo?.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedDimInfo.description}</p>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWeights(!showWeights)}
          className={cn(
            "text-xs border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10",
            showWeights && "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700"
          )}
        >
          <SlidersHorizontal className="w-3 h-3 mr-2" />
          Weight Settings
        </Button>
      </div>

      {showWeights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-indigo-100 dark:border-indigo-900/50 mb-6 animate-in slide-in-from-top-2 backdrop-blur-sm shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Base Score (per comment)</span>
              <span className="font-mono text-slate-900 dark:text-slate-200">{weights.comment}</span>
            </div>
            <Slider
              value={[weights.comment]}
              min={0}
              max={10}
              step={0.1}
              onValueChange={([v]) => setWeights((prev) => ({ ...prev, comment: v }))}
              className="py-2"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Like Weight (per like)</span>
              <span className="font-mono text-slate-900 dark:text-slate-200">{weights.like}</span>
            </div>
            <Slider
              value={[weights.like]}
              min={0}
              max={5}
              step={0.1}
              onValueChange={([v]) => setWeights((prev) => ({ ...prev, like: v }))}
              className="py-2"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Reply Weight (per reply)</span>
              <span className="font-mono text-slate-900 dark:text-slate-200">{weights.reply}</span>
            </div>
            <Slider
              value={[weights.reply]}
              min={0}
              max={5}
              step={0.1}
              onValueChange={([v]) => setWeights((prev) => ({ ...prev, reply: v }))}
              className="py-2"
            />
          </div>
        </div>
      )}

      {/* Sentiment filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedSentiment(null)}
          className={cn(
            "rounded-full text-xs px-3 border",
            !selectedSentiment
              ? "bg-slate-900 dark:bg-white/20 text-white border-slate-900 dark:border-transparent"
              : "text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          All
        </Button>
        {Object.keys(sentimentDistribution).map((sent) => (
          <Button
            key={sent}
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSentiment(selectedSentiment === sent ? null : sent)}
            className={cn(
              "rounded-full text-xs px-3 border",
              selectedSentiment === sent
                ? "bg-slate-900 dark:bg-white/20 text-white border-slate-900 dark:border-transparent"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <span className="w-2 h-2 rounded-full mr-2" style={{ background: sentimentColor(sent) }} />
            {sentimentLabel(sent)}
          </Button>
        ))}
      </div>

      {/* Option cards */}
      <div className="grid gap-4">
        {optionStats.map((opt) => (
          <div
            key={opt.option}
            className={cn(
              "rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden transition-all",
              expandedOption === opt.option
                ? "ring-2 ring-indigo-500/20 dark:ring-indigo-500/30 border-indigo-200 dark:border-indigo-700"
                : "hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md"
            )}
          >
            <div
              className="p-4 flex items-center gap-4 cursor-pointer"
              onClick={() => setExpandedOption(expandedOption === opt.option ? null : opt.option)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{opt.option}</h3>
                  <div className="flex h-1.5 w-24 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    {Object.entries(opt.sentimentBreakdown).map(([sent, count]) => (
                      <div
                        key={sent}
                        style={{
                          width: `${(count / opt.count) * 100}%`,
                          background: sentimentColor(sent),
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{opt.count} comments</span>
                  <span>{opt.likes} likes</span>
                  <span>{opt.replies} replies</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Weighted Score</div>
                <div className="font-mono text-xl text-indigo-600 dark:text-indigo-400 font-semibold">
                  {opt.score.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              {expandedOption === opt.option ? (
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              )}
            </div>

            {expandedOption === opt.option && (
              <div className="border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 p-4 space-y-3 animate-in slide-in-from-top-1">
                {opt.comments
                  .sort((a: any, b: any) => {
                    const scoreA = weights.comment + weights.like * (a.likes || 0) + weights.reply * (a.replies || 0)
                    const scoreB = weights.comment + weights.like * (b.likes || 0) + weights.reply * (b.replies || 0)
                    return scoreB - scoreA
                  })
                  .slice(0, 10)
                  .map((comment: any, idx: number) => (
                    <div key={idx} className="text-sm p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] uppercase font-medium bg-slate-100 dark:bg-white/10"
                            style={{ color: sentimentColor(comment.sentiment) }}
                          >
                            {sentimentLabel(comment.sentiment)}
                          </span>
                          {comment.persona_name && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">{comment.persona_name}</span>
                          )}
                          {comment.topic && (
                            <span className="text-xs text-indigo-500 dark:text-indigo-400">{comment.topic}</span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-slate-400 dark:text-slate-500 flex gap-2">
                          <span>{comment.likes || 0} likes</span>
                          <span>{comment.replies || 0} replies</span>
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{comment.body}</p>
                    </div>
                  ))}
                {opt.comments.length > 10 && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-400">
                      Showing top 10, {opt.comments.length} comments total
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {optionStats.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/15 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {selectedSentiment ? "No comments match the current sentiment filter" : "No valid comments for this dimension"}
          </div>
        )}
      </div>
    </section>
  )
}
