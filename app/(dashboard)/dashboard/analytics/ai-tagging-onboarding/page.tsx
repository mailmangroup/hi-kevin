"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, BarChart3, CalendarDays, Download, Loader2, Plus, RefreshCw, Settings2, Tag, Trash2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/ui/loading"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useUserStore } from "@/lib/store/user-store"
import {
  createAiTaggingJob,
  deleteAiTaggingReport,
  getAiTaggingPreferences,
  getAiTaggingReport,
  listAiTaggingReports,
  pollAiTaggingJob,
  rerunAiTaggingSynthesis,
  retryFailedAiTaggingReport,
  updateAiTaggingPreferences,
  type AiTaggingPreferences,
  type AiTaggingReport,
  type AiTaggingReportSummary,
} from "@/lib/api/ai-tagging-onboarding"
import { AiTaggingReportView } from "./report-view"
import { downloadAiTaggingHtml } from "./report-export"

const POLL_INTERVAL_MS = 1_500

function readinessLabel(value?: string) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Report ready"
}

function NumberField({ label, value, min, max, description, onChange }: {
  label: string
  value: number
  min: number
  max: number
  description: string
  onChange: (value: number) => void
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="block text-xs leading-5 text-muted-foreground">{description}</span>
    </label>
  )
}

function PromptEditor({ label, description, value, onChange }: {
  label: string
  description: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <div><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={18} className="resize-y font-mono text-xs leading-5" />
    </div>
  )
}

export default function AiTaggingOnboardingPage() {
  const { profile } = useUserStore()
  const [reports, setReports] = useState<AiTaggingReportSummary[]>([])
  const [selectedReportId, setSelectedReportId] = useState("")
  const [report, setReport] = useState<AiTaggingReport | null>(null)
  const [preferences, setPreferences] = useState<AiTaggingPreferences | null>(null)
  const [name, setName] = useState("AI Tagging Onboarding Analysis")
  const [productionToken, setProductionToken] = useState("")
  const [productionBrandId, setProductionBrandId] = useState("")
  const [endDate, setEndDate] = useState("")
  const [saveDefaults, setSaveDefaults] = useState(false)
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showPromptSheet, setShowPromptSheet] = useState(false)
  const [retryReportId, setRetryReportId] = useState("")
  const [showRetryDialog, setShowRetryDialog] = useState(false)
  const [showRerunDialog, setShowRerunDialog] = useState(false)
  const [rerunSynthesisPrompt, setRerunSynthesisPrompt] = useState("")
  const [progressMessage, setProgressMessage] = useState("")
  const [progressPhase, setProgressPhase] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const refreshReports = useCallback(async () => {
    setIsLoadingReports(true)
    try {
      const result = await listAiTaggingReports()
      setReports(result.reports || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load reports"))
    } finally {
      setIsLoadingReports(false)
    }
  }, [])

  useEffect(() => {
    if (!profile?.kawo_token) return
    refreshReports()
    setIsLoadingPreferences(true)
    getAiTaggingPreferences()
      .then(setPreferences)
      .catch((err) => setError(err instanceof Error ? err : new Error("Failed to load report defaults")))
      .finally(() => setIsLoadingPreferences(false))
  }, [profile?.kawo_token, refreshReports])

  useEffect(() => {
    if (!selectedReportId) {
      setReport(null)
      return
    }
    let mounted = true
    setIsLoadingReport(true)
    getAiTaggingReport(selectedReportId)
      .then((result) => mounted && setReport(result))
      .catch((err) => mounted && setError(err instanceof Error ? err : new Error("Failed to load report")))
      .finally(() => mounted && setIsLoadingReport(false))
    return () => { mounted = false }
  }, [selectedReportId])

  async function followJob(jobId: string) {
    setIsRunning(true)
    setShowNewDialog(true)
    setProgressMessage("Starting AI tagging onboarding analysis...")
    setProgressPhase(0)
    try {
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        const job = await pollAiTaggingJob(jobId)
        if (job.status === "processing") {
          if (typeof job.results?.phase === "number") setProgressPhase(job.results.phase)
          if (job.results?.message) setProgressMessage(job.results.message)
          continue
        }
        if (job.status === "error") throw new Error(job.error || "AI tagging onboarding analysis failed")
        if (job.results?.report_id) {
          await refreshReports()
          const completedReport = await getAiTaggingReport(job.results.report_id)
          setReport(completedReport)
          setSelectedReportId(job.results.report_id)
          setShowNewDialog(false)
          return
        }
        throw new Error("The completed analysis did not return a report ID")
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("AI tagging onboarding analysis failed"))
      setShowNewDialog(false)
    } finally {
      setIsRunning(false)
    }
  }

  async function runAnalysis() {
    if (!preferences) return
    setError(null)
    try {
      if (saveDefaults) {
        const saved = await updateAiTaggingPreferences(preferences)
        setPreferences(saved)
      }
      const result = await createAiTaggingJob(productionToken, productionBrandId, {
        ...preferences,
        name: name.trim() || undefined,
        end_date: endDate || undefined,
      })
      await refreshReports()
      await followJob(result.job_id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to start analysis"))
      setIsRunning(false)
    }
  }

  async function handleDelete(reportId: string) {
    try {
      await deleteAiTaggingReport(reportId)
      if (selectedReportId === reportId) setSelectedReportId("")
      await refreshReports()
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete report"))
    }
  }

  async function handleRetryFailed() {
    if (!retryReportId) return
    setError(null)
    try {
      const result = await retryFailedAiTaggingReport(retryReportId, productionToken)
      setShowRetryDialog(false)
      await refreshReports()
      await followJob(result.job_id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to retry report"))
    }
  }

  function openRerunSynthesis() {
    if (!report) return
    setRerunSynthesisPrompt(
      report.configuration.prompts?.synthesis || preferences?.prompts.synthesis || "",
    )
    setShowRerunDialog(true)
  }

  async function handleRerunSynthesis() {
    if (!selectedReportId) return
    setError(null)
    try {
      const result = await rerunAiTaggingSynthesis(selectedReportId, rerunSynthesisPrompt)
      setShowRerunDialog(false)
      await refreshReports()
      await followJob(result.job_id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to rerun synthesis"))
    }
  }

  function downloadJsonReport() {
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${report.brand.name || report.brand.id}-ai-tagging-onboarding.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function downloadHtmlReport() {
    if (!report) return
    try {
      downloadAiTaggingHtml(report)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to download HTML report"))
    }
  }

  function patchPreferences<K extends keyof AiTaggingPreferences>(key: K, value: AiTaggingPreferences[K]) {
    setPreferences((current) => current ? { ...current, [key]: value } : current)
  }

  function patchPrompt(key: keyof AiTaggingPreferences["prompts"], value: string) {
    setPreferences((current) => current ? { ...current, prompts: { ...current.prompts, [key]: value } } : current)
  }

  return (
    <div className="space-y-8 p-8 pt-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <Link href="/dashboard/analytics" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Analytics</Link>
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white"><Tag className="h-5 w-5" /></span><div><h1 className="text-3xl font-bold text-foreground">AI Tagging Onboarding Analysis</h1><p className="mt-1 text-sm text-muted-foreground">Turn current tags and post history into an evidence-backed rollout decision.</p></div></div>
        </div>
        <div className="flex gap-2">
          {selectedReportId && <Button variant="outline" onClick={() => setSelectedReportId("")}><ArrowLeft className="mr-2 h-4 w-4" />History</Button>}
          {report && <Button variant="outline" onClick={openRerunSynthesis} disabled={isRunning}><RefreshCw className="mr-2 h-4 w-4" />Rerun synthesis</Button>}
          {report && <Button onClick={downloadHtmlReport}><Download className="mr-2 h-4 w-4" />Download HTML</Button>}
          {report && <Button variant="outline" onClick={downloadJsonReport}>Download JSON</Button>}
        </div>
      </header>

      {error && <ErrorBanner message={error.message} onClose={() => setError(null)} />}

      {!selectedReportId ? (
        <main className="space-y-6">
          <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">History Reports</h2><span className="text-sm text-muted-foreground">{reports.length} saved</span></div>
          {isLoadingReports ? <LoadingState message="Loading reports..." /> : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <button type="button" onClick={() => setShowNewDialog(true)} className="group flex h-56 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-white/60 p-6 text-center transition hover:border-sky-500 hover:bg-white hover:shadow-sm dark:bg-slate-900/60 dark:hover:bg-slate-900">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition group-hover:scale-105 dark:bg-sky-950 dark:text-sky-300"><Plus className="h-6 w-6" /></span>
                <div><p className="font-semibold">New onboarding analysis</p><p className="mt-1 text-sm text-muted-foreground">Use production KAWO credentials</p></div>
              </button>
              {reports.map((reportSummary) => (
                <article key={reportSummary.id} className="flex h-56 flex-col rounded-xl border bg-background p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><BarChart3 className="h-5 w-5" /></span>
                    <Badge variant={reportSummary.status === "error" ? "destructive" : "outline"}>{reportSummary.status}</Badge>
                  </div>
                  <h3 className="mt-4 line-clamp-2 font-semibold">{reportSummary.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{reportSummary.brand_name || reportSummary.brand_id}</p>
                  <div className="mt-auto flex items-end justify-between gap-3">
                    <div className="text-xs text-muted-foreground"><p>{reportSummary.readiness_status ? readinessLabel(reportSummary.readiness_status) : reportSummary.status === "processing" ? "Analysis in progress" : reportSummary.error || "No summary"}</p><p className="mt-1">{reportSummary.updated_at ? new Date(reportSummary.updated_at).toLocaleString() : ""}</p></div>
                    <div className="flex gap-1">
                      {reportSummary.status === "processing" && reportSummary.job_id && <Button size="sm" variant="outline" onClick={() => followJob(reportSummary.job_id!)}>Follow</Button>}
                      {reportSummary.status === "done" && <Button size="sm" onClick={() => setSelectedReportId(reportSummary.id)}>Open</Button>}
                      {reportSummary.status === "error" && <Button size="sm" onClick={() => { setRetryReportId(reportSummary.id); setShowRetryDialog(true) }}>Retry</Button>}
                      <Button size="sm" variant="ghost" aria-label={`Delete ${reportSummary.name}`} onClick={() => handleDelete(reportSummary.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      ) : isLoadingReport ? <LoadingState message="Loading onboarding report..." /> : report ? <AiTaggingReportView report={report} /> : null}

      <Dialog open={showNewDialog} onOpenChange={(open) => !isRunning && setShowNewDialog(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>New AI Tagging Onboarding Analysis</DialogTitle><DialogDescription>分析指定生产环境品牌的现有标签体系和近期已发布的帖子。</DialogDescription></DialogHeader>
          {isRunning ? (
            <div className="flex min-h-[390px] flex-col items-center justify-center px-4 py-10 text-center">
              <div className="w-full max-w-md rounded-2xl border border-sky-200 bg-sky-50/70 p-6 dark:border-sky-900 dark:bg-sky-950/30">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-700 dark:text-sky-300" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Stage {progressPhase || 1} of 8</p>
                <h3 className="mt-2 text-lg font-semibold">Analysis in progress</h3>
                <p className="mt-2 min-h-10 text-sm text-muted-foreground" aria-live="polite">{progressMessage}</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950"><div className="h-full rounded-full bg-sky-600 transition-all duration-500" style={{ width: `${Math.max(5, progressPhase / 8 * 100)}%` }} /></div>
                <p className="mt-3 text-xs text-muted-foreground">您可以关闭此页面，稍后在报告历史中查看分析进度。</p>
              </div>
            </div>
          ) : isLoadingPreferences || !preferences ? <LoadingState message="Loading analysis defaults..." /> : (
            <div className="space-y-5">
              <div className="space-y-1.5"><label htmlFor="tag-report-name" className="text-sm font-medium">Report name</label><Input id="tag-report-name" value={name} onChange={(event) => setName(event.target.value)} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><label htmlFor="tag-production-token" className="text-sm font-medium">Production KAWO token</label><Input id="tag-production-token" type="password" autoComplete="off" value={productionToken} onChange={(event) => setProductionToken(event.target.value)} /><span className="block text-xs text-muted-foreground">用于读取生产环境数据，不会使用 staging token。</span></div>
                <div className="space-y-1.5"><label htmlFor="tag-production-brand-id" className="text-sm font-medium">Production brand ID</label><Input id="tag-production-brand-id" value={productionBrandId} onChange={(event) => setProductionBrandId(event.target.value)} /><span className="block text-xs text-muted-foreground">要分析的生产环境品牌 ID。</span></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5"><span className="text-sm font-medium">End date</span><Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /><span className="block text-xs text-muted-foreground">留空则包含截至今天发布的帖子。</span></label>
                <NumberField label="Analysis window" value={preferences.days} min={1} max={365} description="要获取的已发布帖子历史天数。" onChange={(value) => patchPreferences("days", value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField label="Maximum posts to analyze" value={preferences.max_vision_posts} min={1} max={500} description="最多选取此数量的代表性帖子发送给 AI 进行标签分析。" onChange={(value) => patchPreferences("max_vision_posts", value)} />
                <NumberField label="Images per post" value={preferences.max_images} min={0} max={12} description="每篇帖子最多提供给模型的图片数量。" onChange={(value) => patchPreferences("max_images", value)} />
                <label className="space-y-1.5"><span className="text-sm font-medium">Model</span><Input value={preferences.model} onChange={(event) => patchPreferences("model", event.target.value)} /><span className="block text-xs text-muted-foreground">所有 AI 分析阶段使用的模型。</span></label>
              </div>
              <button type="button" onClick={() => setShowPromptSheet(true)} className="flex w-full items-center justify-between rounded-xl border bg-muted/30 p-4 text-left hover:bg-muted/50"><div className="flex gap-3"><Settings2 className="mt-0.5 h-5 w-5 text-sky-600" /><div><p className="text-sm font-medium">Prompts and advanced parameters</p><p className="mt-1 text-xs text-muted-foreground">四个提示词 · 并发数、推理预算和超时设置</p></div></div><span className="text-sm text-muted-foreground">Edit</span></button>
              <div className="space-y-3 rounded-xl border p-4">
                <label className="flex items-center justify-between gap-4 text-sm"><span><span className="font-medium">Save as my defaults</span><span className="mt-0.5 block text-xs text-muted-foreground">将这些参数和提示词用于之后创建的报告。</span></span><input type="checkbox" checked={saveDefaults} onChange={(event) => setSaveDefaults(event.target.checked)} className="h-4 w-4 rounded" /></label>
              </div>
              <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowNewDialog(false)}>Cancel</Button><Button onClick={runAnalysis} disabled={!name.trim() || !productionToken.trim() || !productionBrandId.trim() || !preferences.model.trim() || Object.values(preferences.prompts).some((prompt) => !prompt.trim())}><CalendarDays className="mr-2 h-4 w-4" />Run analysis</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Retry failed report</DialogTitle>
            <DialogDescription>Successful per-post analysis will be reused. Enter the production token again to retry only failed work.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="retry-production-token" className="text-sm font-medium">Production KAWO token</label>
            <Input id="retry-production-token" type="password" autoComplete="off" value={productionToken} onChange={(event) => setProductionToken(event.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowRetryDialog(false)}>Cancel</Button>
            <Button onClick={handleRetryFailed} disabled={!productionToken.trim()}>Retry failed work</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRerunDialog} onOpenChange={(open) => !isRunning && setShowRerunDialog(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rerun synthesis</DialogTitle>
            <DialogDescription>
              Update the synthesis prompt for this run. Existing taxonomy, post analysis, and review results will be reused.
            </DialogDescription>
          </DialogHeader>
          <PromptEditor
            label="Readiness synthesis prompt"
            description="Controls how the existing evidence is turned into the conclusion, recommendation, and category guidance."
            value={rerunSynthesisPrompt}
            onChange={setRerunSynthesisPrompt}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowRerunDialog(false)}>Cancel</Button>
            <Button onClick={handleRerunSynthesis} disabled={!rerunSynthesisPrompt.trim()}>
              <RefreshCw className="mr-2 h-4 w-4" />Rerun synthesis
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {preferences && <Sheet open={showPromptSheet} onOpenChange={setShowPromptSheet}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b pr-10"><SheetTitle>Prompts and advanced parameters</SheetTitle><SheetDescription>提示词的输出结构和确定性指标计算方式保持固定。</SheetDescription></SheetHeader>
          <div className="space-y-6 px-4 py-5">
            <Tabs defaultValue="tagging">
              <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4"><TabsTrigger value="tagging">Tagging</TabsTrigger><TabsTrigger value="inference">Inference</TabsTrigger><TabsTrigger value="review">Review</TabsTrigger><TabsTrigger value="synthesis">Synthesis</TabsTrigger></TabsList>
              <TabsContent value="tagging" className="pt-4"><PromptEditor label="Post tagging prompt" description="控制如何将可观察的内容映射到已配置的标签值。" value={preferences.prompts.tagging} onChange={(value) => patchPrompt("tagging", value)} /></TabsContent>
              <TabsContent value="inference" className="pt-4"><PromptEditor label="Inference-source prompt" description="确定哪些类别可由内容推断，哪些需要业务元数据。" value={preferences.prompts.inference_source} onChange={(value) => patchPrompt("inference_source", value)} /></TabsContent>
              <TabsContent value="review" className="pt-4"><PromptEditor label="Disagreement review prompt" description="审查现有标签与 AI 输出之间的差异，不偏向任一来源。" value={preferences.prompts.review} onChange={(value) => patchPrompt("review", value)} /></TabsContent>
              <TabsContent value="synthesis" className="pt-4"><PromptEditor label="Readiness synthesis prompt" description="将计算得出的依据转化为面向客户的上线建议。" value={preferences.prompts.synthesis} onChange={(value) => patchPrompt("synthesis", value)} /></TabsContent>
            </Tabs>
            <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
              <NumberField label="Tagging concurrency" value={preferences.tagging_concurrency} min={1} max={30} description="可同时进行的标签和类别调用的最大数量。" onChange={(value) => patchPreferences("tagging_concurrency", value)} />
              <NumberField label="Review concurrency" value={preferences.review_concurrency} min={1} max={30} description="可同时进行的标签差异审查的最大数量。" onChange={(value) => patchPreferences("review_concurrency", value)} />
              <NumberField label="Thinking budget" value={preferences.thinking_budget} min={0} max={32768} description="用于审查和汇总阶段的推理 Token 预算。" onChange={(value) => patchPreferences("thinking_budget", value)} />
              <NumberField label="LLM timeout (seconds)" value={preferences.llm_timeout} min={30} max={900} description="每次模型请求允许的最长等待时间。" onChange={(value) => patchPreferences("llm_timeout", value)} />
            </div>
          </div>
          <SheetFooter className="border-t"><Button onClick={() => setShowPromptSheet(false)}>Done</Button></SheetFooter>
        </SheetContent>
      </Sheet>}
    </div>
  )
}
