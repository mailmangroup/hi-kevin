
"use client"

import { useEffect, useMemo, useState } from "react"
import { directApiCall } from "@/lib/api/client"
import { ErrorBanner } from "@/components/ui/error-banner"
import { LoadingState } from "@/components/ui/loading"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, FileText, Calendar, MessageSquare, BarChart3, Clock, Trash2 } from "lucide-react"
import { FileUploader } from "./file-uploader"
import { AnalysisProgress } from "./analysis-progress"
import { TopicAnalysis } from "./topic-analysis"
import { DimensionAnalysis } from "./dimension-analysis"
import { CommentList } from "./comment-list"
import { analyzeContentStream, type AnalysisPhase } from "@/lib/api/content-analysis"
import { sentimentLabel, sentimentColor, sentimentBadgeClass } from "@/lib/utils/sentiment"
import type { ProcessedComment } from "@/lib/utils/file-processor"
import { cn } from "@/lib/utils"

type DataSource = {
  id: string
  name: string
  description?: string
  updated_at?: string
  comment_count?: number
  filename?: string
}

type Summary = {
  total_reviews: number
  tagged_reviews: number
  persona_count: number
  avg_rating?: number
}

type PersonaTopic = {
  topic_id: number
  label: string
  description?: string
  count: number
}

type Persona = {
  name: string
  count: number
  description?: string
  scenario?: string
  core_need?: string
  analysis?: string
  color?: string
  tags: Record<string, string>
  dimension?: string[]
  topics?: PersonaTopic[]
  topic_labels?: string[]
}

type GoldenSample = {
  sentiment: string
  sentiment_class?: string
  persona_name?: string
  topic?: string
  info_score?: number
  body: string
  reason?: string
  tags: Record<string, string>
  likes?: number
  replies?: number
}

type InsightStrength = {
  point: string
  evidence: string
  keywords?: string[]
}

type InsightPainPoint = {
  point: string
  root_cause: string
  severity: string
  evidence: string
}

type InsightSuggestion = {
  suggestion: string
  priority: string
  expected_roi: string
}

type InsightOpportunity = {
  type: string
  description: string
  evidence: string
}

type InsightExecution = {
  urgency: string
  directive: string
  details: string
  roi: string
}

type Insights = {
  error?: string
  overview?: string
  user_personas?: { name: string; description: string; scenario?: string; core_need?: string; analysis?: string }[]
  strengths?: InsightStrength[]
  pain_points?: InsightPainPoint[]
  suggestions?: InsightSuggestion[]
  opportunities?: InsightOpportunity[]
  execution_matrix?: InsightExecution[]
}

type SchemaDimension = {
  key: string
  description: string
  options: string[]
}

type CommentAnalysisReport = {
  filename?: string
  analysis_date?: string
  summary: Summary
  insights?: Insights
  personas?: Persona[]
  sentiment_distribution?: Record<string, number>
  tag_statistics?: Record<string, number>
  golden_samples?: GoldenSample[]
  tagged_data?: any[]
  schema_snapshot?: {
    dimensions: SchemaDimension[]
  }
}

const EXCLUDED_TAG_VALUES = new Set(["Unknown", "unknown", "不明", "未提及", "nan", "None"])

function formatAnalysisDate(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}


function filterTags(tags: Record<string, string>) {
  return Object.entries(tags).filter(([, value]) => value && !EXCLUDED_TAG_VALUES.has(value))
}

export default function CommentAnalysisPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [report, setReport] = useState<CommentAnalysisReport | null>(null)
  const [isLoadingSources, setIsLoadingSources] = useState(true)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisPhase, setAnalysisPhase] = useState<number>(0)
  const [analysisMessage, setAnalysisMessage] = useState<string>("")
  const [showUploader, setShowUploader] = useState(false)

  // Load sources on mount
  useEffect(() => {
    let isMounted = true

    async function loadSources() {
      try {
        setIsLoadingSources(true)
        setError(null)

        const response = await directApiCall<{ sources: DataSource[] }>(
          "content-analysis/data-sources"
        )

        if (!isMounted) return

        const sources = response?.sources ?? []
        setDataSources(sources)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err : new Error("Failed to load data sources"))
      } finally {
        if (isMounted) setIsLoadingSources(false)
      }
    }

    loadSources()
    return () => {
      isMounted = false
    }
  }, [])

  // Load report when source changes
  useEffect(() => {
    if (!selectedSourceId) {
      setReport(null)
      return
    }

    const sourceId = selectedSourceId
    let isMounted = true

    async function loadReport() {
      try {
        setIsLoadingReport(true)
        setError(null)
        // Hide uploader if we are loading a report
        setShowUploader(false)

        const response = await directApiCall<CommentAnalysisReport>(
          `content-analysis/content-analysis?source_id=${encodeURIComponent(sourceId)}`
        )

        if (!isMounted) return
        setReport(response)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err : new Error("Failed to load comment analysis"))
      } finally {
        if (isMounted) setIsLoadingReport(false)
      }
    }

    loadReport()
    return () => {
      isMounted = false
    }
  }, [selectedSourceId])

  const handleFileProcessed = async (comments: ProcessedComment[], filename: string, name: string, postContent: string) => {
    setIsAnalyzing(true)
    setAnalysisPhase(0)
    setAnalysisMessage("Starting analysis...")
    setShowUploader(false) // Hide uploader, show progress

    try {
      const items = comments.map(c => ({
        type: "text",
        content: c.content,
        transcript: c.transcript,
        imageDescription: c.imageDescription,
        likes: c.likes,
        replies: c.replies,
      }))

      const stream = analyzeContentStream({
        items,
        filename,
        name: name || filename.split('.')[0] || "Uploaded Analysis",
        post_content: postContent || undefined,
      })

      for await (const update of stream) {
        if (typeof update.phase === 'number') {
          setAnalysisPhase(update.phase)
          if (update.message) setAnalysisMessage(update.message)
        } else if (update.phase === 'done' && update.source_id) {
          // Analysis complete
          // Reload sources and select the new one
          const response = await directApiCall<{ sources: DataSource[] }>("content-analysis/data-sources")
          const sources = response?.sources ?? []
          setDataSources(sources)
          setSelectedSourceId(update.source_id)
          setIsAnalyzing(false)
          return
        } else if (update.phase === 'error') {
          throw new Error(update.message || "Analysis failed")
        }
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err : new Error("Analysis failed"))
      setIsAnalyzing(false)
      setShowUploader(true) // Show uploader again on error
    }
  }

  const totalSentiment = useMemo(() => {
    if (!report?.sentiment_distribution) return 0
    return Object.values(report.sentiment_distribution).reduce((sum, value) => sum + value, 0)
  }, [report?.sentiment_distribution])

  const handleDeleteSource = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this analysis report?")) return

    try {
      await directApiCall(`content-analysis/data-sources/${id}`, { method: "DELETE" })
      setDataSources(prev => prev.filter(s => s.id !== id))
      if (selectedSourceId === id) {
        setSelectedSourceId(null)
        setReport(null)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to delete report")
    }
  }

  // =================================================================================================
  // VIEW 1: LIST VIEW (Dashboard)
  // =================================================================================================
  if (!isAnalyzing && !showUploader && !selectedSourceId) {
    if (isLoadingSources) {
      return <LoadingState message="Loading reports..." />
    }

    return (
      <div className="min-h-screen text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
          <header className="flex items-center justify-between pb-6 border-b border-indigo-100 dark:border-indigo-800">
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Comment Analysis
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                AI-powered insights from your customer feedback
              </p>
            </div>
          </header>

          {error && (
            <ErrorBanner
              title="Failed to load reports"
              message={error.message}
              action={{ label: "Retry", onClick: () => window.location.reload() }}
            />
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Create New Card */}
            <div 
              onClick={() => setShowUploader(true)}
              className="group relative flex h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-700 bg-white/50 dark:bg-slate-800/50 p-6 text-center transition-all hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/70">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">New Analysis</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upload CSV/Excel file</p>
              </div>
            </div>

            {/* Report Cards */}
            {dataSources.map((source) => (
              <div
                key={source.id}
                onClick={() => setSelectedSourceId(source.id)}
                className="group relative flex h-64 cursor-pointer flex-col justify-between rounded-xl border border-white/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-3">
                      {source.updated_at && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <Clock className="h-3 w-3" />
                          {formatAnalysisDate(source.updated_at)}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 dark:text-slate-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteSource(e, source.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="line-clamp-2 font-serif text-lg font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {source.name}
                    </h3>
                    {source.filename && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <FileText className="h-3 w-3" />
                        {source.filename}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>{source.comment_count || 0} reviews</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Header for other views
  const renderHeader = () => (
    <header className="border-b border-indigo-100 dark:border-indigo-800 pb-6 mb-8">
      <div className="flex items-center gap-4">
        {selectedSourceId && !isAnalyzing && !showUploader && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSourceId(null)
              setReport(null)
            }}
            className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {isAnalyzing ? "Analyzing Content..." : showUploader ? "New Analysis" : report?.filename || "Analysis Report"}
          </h1>
          {!isAnalyzing && !showUploader && report && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
               <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {report.summary.total_reviews} reviews</span>
               <span>·</span>
               <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {report.analysis_date && formatAnalysisDate(report.analysis_date)}</span>
            </p>
          )}
        </div>
      </div>
    </header>
  )

  // =================================================================================================
  // VIEW 2: GENERATOR / PROGRESS
  // =================================================================================================

  if (isAnalyzing) {
    return (
      <div className="relative min-h-screen text-slate-900 dark:text-slate-100">
        <div className="relative mx-auto max-w-6xl space-y-12 px-6 py-10">
          {renderHeader()}
          <AnalysisProgress phase={analysisPhase} message={analysisMessage} />
        </div>
      </div>
    )
  }

  if (showUploader) {
    return (
      <div className="relative min-h-screen text-slate-900 dark:text-slate-100">
        <div className="relative mx-auto max-w-6xl space-y-12 px-6 py-10">
          <header className="border-b border-indigo-100 dark:border-indigo-800 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUploader(false)}
                className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                New Analysis
              </h1>
            </div>
          </header>

          <div className="py-12">
            <FileUploader onDataProcessed={handleFileProcessed} />
          </div>
        </div>
      </div>
    )
  }

  // =================================================================================================
  // VIEW 3: REPORT DETAIL
  // =================================================================================================

  if (isLoadingReport || !report) {
    return <LoadingState message="Rendering analysis report..." />
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorBanner
          title="Analysis Error"
          message={error.message}
          action={{
            label: "Back to list",
            onClick: () => {
              setError(null)
              setSelectedSourceId(null)
            },
          }}
        />
      </div>
    )
  }

  const summary = report.summary

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100">
      <div className="relative mx-auto max-w-6xl space-y-12 px-6 py-10">
        {renderHeader()}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="relative overflow-hidden rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-5">
            <div className="text-[0.7rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Total Reviews</div>
            <div className="mt-3 font-mono text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {summary.total_reviews}
              <span className="ml-1 text-sm text-slate-400 dark:text-slate-500">items</span>
            </div>
            <div className="absolute inset-y-0 left-0 w-1 bg-sky-400" />
          </div>
          <div className="relative overflow-hidden rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-5">
            <div className="text-[0.7rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Tagged</div>
            <div className="mt-3 font-mono text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {summary.tagged_reviews}
              <span className="ml-1 text-sm text-slate-400 dark:text-slate-500">items</span>
            </div>
            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" />
          </div>
          <div className="relative overflow-hidden rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-5">
            <div className="text-[0.7rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Personas</div>
            <div className="mt-3 font-mono text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {summary.persona_count}
              <span className="ml-1 text-sm text-slate-400 dark:text-slate-500">types</span>
            </div>
            <div className="absolute inset-y-0 left-0 w-1 bg-purple-400" />
          </div>
          {summary.avg_rating !== undefined && summary.avg_rating > 0 ? (
            <div className="relative overflow-hidden rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-5">
              <div className="text-[0.7rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Avg Rating</div>
              <div className="mt-3 font-mono text-3xl font-semibold text-slate-900 dark:text-slate-100">
                {summary.avg_rating}
                <span className="ml-1 text-sm text-slate-400 dark:text-slate-500">/5</span>
              </div>
              <div className="absolute inset-y-0 left-0 w-1 bg-amber-400" />
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
        </section>

        {/* 1. Insights */}
        {report.insights && !report.insights.error && (
          <section className="space-y-6">
            <div className="flex items-baseline gap-4 border-b border-indigo-100 dark:border-indigo-800 pb-4">
              <span className="font-serif text-4xl font-light text-indigo-200 dark:text-indigo-800">01</span>
              <div>
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">Strategic Insights</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">AI-generated comprehensive analysis</p>
              </div>
            </div>

            {/* Overview */}
            {report.insights.overview && (
              <div className="rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {report.insights.overview}
              </div>
            )}

            {/* Strengths */}
            {!!report.insights.strengths?.length && (
              <div className="rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-6">
                <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100 mb-4">Strengths</h3>
                <div className="space-y-4">
                  {report.insights.strengths.map((s, i) => (
                    <div key={i} className="border-l-2 border-emerald-400 pl-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.point}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 italic">{s.evidence}</p>
                      {s.keywords?.length && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {s.keywords.map((kw, j) => (
                            <span key={j} className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pain Points */}
            {!!report.insights.pain_points?.length && (
              <div className="rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-6">
                <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100 mb-4">Pain Points</h3>
                <div className="space-y-4">
                  {report.insights.pain_points.map((p, i) => (
                    <div key={i} className="border-l-2 border-rose-400 pl-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.point}</p>
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                          p.severity === "High" ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : p.severity === "Medium" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        )}>{p.severity}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.root_cause}</p>
                      <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 italic">{p.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {!!report.insights.suggestions?.length && (
              <div className="rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-6">
                <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100 mb-4">Suggestions</h3>
                <div className="space-y-4">
                  {report.insights.suggestions.map((s, i) => (
                    <div key={i} className="border-l-2 border-indigo-400 pl-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.suggestion}</p>
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                          s.priority === "High" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : s.priority === "Medium" ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        )}>{s.priority}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.expected_roi}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {!!report.insights.opportunities?.length && (
              <div className="rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-6">
                <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100 mb-4">Opportunities</h3>
                <div className="space-y-4">
                  {report.insights.opportunities.map((o, i) => (
                    <div key={i} className="border-l-2 border-amber-400 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">{o.type}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{o.description}</p>
                      <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 italic">{o.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Matrix */}
            {!!report.insights.execution_matrix?.length && (
              <div className="rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-6">
                <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100 mb-4">Execution Matrix</h3>
                <div className="space-y-3">
                  {report.insights.execution_matrix.map((e, i) => (
                    <div key={i} className="flex items-start gap-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 p-4">
                      <span className={cn(
                        "shrink-0 rounded px-2 py-1 text-xs font-medium",
                        e.urgency === "Immediate" ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300"
                      )}>{e.urgency}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{e.directive}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{e.details}</p>
                        <p className="mt-1 text-xs text-indigo-500 dark:text-indigo-400">ROI: {e.roi}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 2. Sentiment Distribution */}
        {!!report.sentiment_distribution && (
          <section className="space-y-6">
            <div className="flex items-baseline gap-4 border-b border-indigo-100 dark:border-indigo-800 pb-4">
              <span className="font-serif text-4xl font-light text-indigo-200 dark:text-indigo-800">02</span>
              <div>
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">Sentiment Analysis</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Distribution of customer sentiment</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-6">
              <div className="space-y-4">
                {Object.entries(report.sentiment_distribution).map(([label, count]) => {
                  const percent = totalSentiment ? Math.round((count / totalSentiment) * 1000) / 10 : 0

                  return (
                    <div key={label} className="flex flex-wrap items-center gap-3">
                      <div className="min-w-[110px] text-sm text-slate-500 dark:text-slate-400">{sentimentLabel(label)}</div>
                      <div className="h-8 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${percent}%`,
                            background: sentimentColor(label),
                          }}
                        />
                      </div>
                      <div className="min-w-[90px] text-right font-mono text-sm text-slate-600 dark:text-slate-300">
                        {count} ({percent}%)
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* 3. Personas */}
        {!!report.personas?.length && (
          <section className="space-y-6">
            <div className="flex items-baseline gap-4 border-b border-indigo-100 dark:border-indigo-800 pb-4">
              <span className="font-serif text-4xl font-light text-indigo-200 dark:text-indigo-800">03</span>
              <div>
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">User Personas</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Identified {report.personas.length} key customer profiles
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {report.personas?.map((persona, index) => (
                <div
                  key={`${persona.name}-${index}`}
                  className="relative overflow-hidden rounded-xl border border-white/50 dark:border-slate-700/50 bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-800/70 backdrop-blur-sm p-6"
                  style={{
                    boxShadow: "0 12px 30px rgba(99,102,241,0.05)",
                  }}
                >
                  <div
                    className="absolute right-0 top-0 h-20 w-20 rounded-bl-full"
                    style={{
                      background: `radial-gradient(circle at top right, ${persona.color ?? "#6366f1"}20 0%, transparent 70%)`,
                    }}
                  />
                  <div className="flex items-start justify-between">
                    <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100">{persona.name}</h3>
                    <span
                      className="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-1 text-xs font-mono"
                      style={{ color: persona.color ?? "#6366f1" }}
                    >
                      {persona.count} users
                    </span>
                  </div>
                  {persona.description && (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{persona.description}</p>
                  )}
                  {persona.scenario && (
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500"><span className="font-medium text-slate-500 dark:text-slate-400">Scenario:</span> {persona.scenario}</p>
                  )}
                  {persona.core_need && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500"><span className="font-medium text-slate-500 dark:text-slate-400">Core Need:</span> {persona.core_need}</p>
                  )}
                  {persona.analysis && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500"><span className="font-medium text-slate-500 dark:text-slate-400">Analysis:</span> {persona.analysis}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {filterTags(persona.tags).map(([key, value]) => (
                      <span
                        key={`${persona.name}-${key}`}
                        className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-1 text-xs text-slate-500 dark:text-slate-400"
                      >
                        {key}: <span className="text-slate-900 dark:text-slate-200 font-medium">{value}</span>
                      </span>
                    ))}
                  </div>
                  {!!persona.topic_labels?.length && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {persona.topic_labels.map((label, ti) => (
                        <span key={ti} className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 px-2.5 py-0.5 text-xs text-indigo-600 dark:text-indigo-400">
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Dimension / Topic Analysis */}
        {report.tagged_data && report.sentiment_distribution && (
          report.schema_snapshot?.dimensions?.length ? (
            <DimensionAnalysis
              taggedData={report.tagged_data}
              sentimentDistribution={report.sentiment_distribution}
              schemaSnapshot={report.schema_snapshot}
            />
          ) : (
            <TopicAnalysis
              taggedData={report.tagged_data}
              sentimentDistribution={report.sentiment_distribution}
            />
          )
        )}

        {/* 5. Golden Samples */}
        {!!report.golden_samples?.length && (
          <section className="space-y-6">
            <div className="flex items-baseline gap-4 border-b border-indigo-100 dark:border-indigo-800 pb-4">
              <span className="font-serif text-4xl font-light text-indigo-200 dark:text-indigo-800">05</span>
              <div>
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">Golden Samples</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Deep dive into high-information comments</p>
              </div>
            </div>
            <div className="space-y-4">
              {report.golden_samples.map((sample, index) => {
                const accentClass = sentimentBadgeClass(sample.sentiment)

                return (
                  <details
                    key={`${sample.body}-${index}`}
                    className="group rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${accentClass}`}>
                          {sentimentLabel(sample.sentiment)}
                        </span>
                        {sample.persona_name && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">{sample.persona_name}</span>
                        )}
                      </div>
                      {sample.info_score !== undefined && (
                        <span className="rounded bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs font-mono text-amber-600 dark:text-amber-400">
                          {sample.info_score}/10
                        </span>
                      )}
                    </summary>
                    <div className="px-5 pb-5 text-sm text-slate-500 dark:text-slate-400">
                      <p className="leading-7 text-slate-600 dark:text-slate-300">{sample.body}</p>
                      {sample.reason && (
                        <p className="mt-3 text-sm italic text-indigo-600 dark:text-indigo-400">{sample.reason}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {filterTags(sample.tags).map(([key, value]) => (
                          <span
                            key={`${index}-${key}`}
                            className="rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-3 py-1 text-xs text-sky-600 dark:text-sky-400"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          </section>
        )}

        {/* 6. All Comments */}
        {!!report.tagged_data?.length && (
          <CommentList taggedData={report.tagged_data} personas={report.personas ?? []} />
        )}

        <footer className="border-t border-indigo-100 dark:border-indigo-800 py-10 text-center text-xs text-slate-400 dark:text-slate-500">
          <div className="font-serif text-lg text-indigo-600 dark:text-indigo-400">Generated by AI</div>
          {report.analysis_date && <p className="mt-2">{formatAnalysisDate(report.analysis_date)}</p>}
        </footer>
      </div>
    </div>
  )
}
