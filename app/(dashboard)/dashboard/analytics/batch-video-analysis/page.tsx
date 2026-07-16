"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BarChart3, CheckCircle2, Clock, Download, FileJson, Loader2, Plus, RotateCcw, Search, Settings2, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ErrorBanner } from "@/components/ui/error-banner"
import { LoadingState } from "@/components/ui/loading"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/lib/store/user-store"
import {
  createBatchVideoAnalysisJob,
  deleteBatchVideoAnalysisSource,
  getBatchVideoAnalysisPreferences,
  getBatchVideoAnalysisReport,
  listBatchVideoAnalysisSources,
  pollBatchVideoAnalysisJob,
  updateBatchVideoAnalysisPreferences,
  type BatchVideoAnalysisPreferences,
  type BatchVideoAnalysisSource,
} from "@/lib/api/batch-video-analysis"
import {
  processBatchVideoFiles,
  type BatchVideoParseResult,
} from "@/lib/utils/batch-video-processor"

type Violation = {
  violation_type: string
  risk_level: "高"
  evidence: string
  reason: string
  remediation: string
}

type RiskReminder = {
  risk_level: "低"
  category: string
  evidence: string
  reason: string
  remediation?: string
}

type AuditCategory = {
  name: string
  description: string
}

type VideoResult = {
  item_id: string
  url?: string
  account_name?: string
  account_desc?: string
  post_title?: string
  post_desc?: string
  publish_time?: string
  transcript?: string
  status: "compliant" | "violating" | "not_reviewable"
  absolute_expression: boolean
  violations: Violation[]
}

type BatchVideoReport = {
  filename?: string
  analysis_date?: string
  audit_period?: string
  audit_categories?: AuditCategory[]
  analysis_target?: string
  judgment_rules?: string[]
  account_summary_prompt?: string
  issue_remediation_prompt?: string
  final_recommendations_prompt?: string
  stats?: {
    total_videos: number
    reviewable_videos: number
    not_reviewable_videos: number
    compliant_videos: number
    violating_videos: number
    violation_rate: number
    category_counts: Record<string, number>
  }
  summary?: {
    overall_conclusion?: string
    highlight_risks?: string[]
  }
  video_results?: VideoResult[]
  account_summaries?: {
    account_name: string
    account_desc?: string
    reviewed_count: number
    violation_count: number
    high_risk_count: number
    note?: string
  }[]
  issue_summaries?: {
    category: string
    count: number
    remediation: string
    examples: { account_name?: string; item_id?: string; evidence?: string; risk_level?: string }[]
  }[]
  recommendations?: { title: string; description: string }[]
  appendix?: {
    compliant_accounts_note?: string
    supplementary_risk_reminders?: (RiskReminder & {
      account_name?: string
      item_id?: string
      post_title?: string
    })[]
  }
}

type AccountSummary = NonNullable<BatchVideoReport["account_summaries"]>[number]

const POLL_INTERVAL_MS = 5000
const ISSUE_EXAMPLE_LIMIT = 3
const DEFAULT_ANALYSIS_TARGET = ""

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatDate(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function riskClass(level?: string) {
  if (level === "高" || level === "重度违规") return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50"
  return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50"
}

function formatPercent(numerator?: number, denominator?: number) {
  if (!denominator) return "0%"
  return `${Math.round(((numerator || 0) / denominator) * 100)}%`
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold", className)}>{children}</span>
}

function PromptEditor({
  title,
  description,
  value,
  defaultValue,
  onChange,
  disabled,
}: {
  title: string
  description: string
  value: string
  defaultValue: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground"
          onClick={() => onChange(defaultValue)}
          disabled={disabled || value === defaultValue}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={12}
        maxLength={8000}
        disabled={disabled}
        className="resize-y leading-relaxed"
      />
      <div className="text-right text-xs text-muted-foreground">{value.length.toLocaleString()} / 8,000</div>
    </div>
  )
}

function SettingsDrawerRow({
  title,
  description,
  onEdit,
  disabled,
}: {
  title: string
  description: string
  onEdit: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm">
          <Settings2 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          <div className="truncate text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onEdit} disabled={disabled}>
        Edit
      </Button>
    </div>
  )
}

function detailRowSearchText(row: VideoResult) {
  return [
    row.account_name,
    row.account_desc,
    row.item_id,
    row.url,
    row.post_title,
    row.post_desc,
    row.transcript,
    ...row.violations.flatMap((violation) => [
      violation.risk_level,
      violation.violation_type,
      violation.evidence,
      violation.reason,
      violation.remediation,
    ]),
  ].join(" ").toLowerCase()
}

function buildDisplayAccountSummaries(report: BatchVideoReport): AccountSummary[] {
  const existingSummaries = report.account_summaries || []
  if (!report.video_results?.length) {
    return existingSummaries.filter((account) => account.violation_count > 0)
  }

  const existingByAccount = new Map(existingSummaries.map((account) => [account.account_name, account]))
  const accounts = new Map<string, AccountSummary>()

  report.video_results.forEach((row) => {
    if (row.status === "not_reviewable") return
    const accountName = row.account_name || "未命名账号"
    const account = accounts.get(accountName) || {
      account_name: accountName,
      account_desc: row.account_desc || existingByAccount.get(accountName)?.account_desc || "",
      reviewed_count: 0,
      violation_count: 0,
      high_risk_count: 0,
      note: existingByAccount.get(accountName)?.note || "",
    }

    account.reviewed_count += 1
    if (row.status === "violating") {
      account.violation_count += 1
      if (row.violations.some((violation) => violation.risk_level === "高")) {
        account.high_risk_count += 1
      }
    }
    accounts.set(accountName, account)
  })

  return Array.from(accounts.values()).filter((account) => account.violation_count > 0)
}

function buildHtmlReport(report: BatchVideoReport) {
  const stats = report.stats
  const totalCategoryCount = Object.values(stats?.category_counts || {}).reduce((sum, count) => sum + count, 0)
  const categoryRows = Object.entries(stats?.category_counts || {})
    .filter(([, count]) => count > 0)
    .map(([category, count]) => {
      const pct = totalCategoryCount ? Math.round((count / totalCategoryCount) * 100) : 0
      return `<div class="bar-row"><div>${escapeHtml(category)}</div><div class="bar-bg"><div class="bar" style="width:${pct}%"></div></div><b>${pct}%</b></div>`
    }).join("")

  const accountRows = buildDisplayAccountSummaries(report).map((account) => `
    <tr><td>${account.account_desc ? `<div class="tooltip-container"><span style="text-decoration: underline dashed #cbd5e1; text-underline-offset: 4px; cursor: help;">${escapeHtml(account.account_name)}</span><div class="tooltip-text">${escapeHtml(account.account_desc)}</div></div>` : `<span>${escapeHtml(account.account_name)}</span>`}</td><td>${account.reviewed_count}</td><td>${account.violation_count}</td><td>${escapeHtml(formatPercent(account.violation_count, account.reviewed_count))}</td><td>${escapeHtml(account.note)}</td></tr>
  `).join("")

  const issueCards = (report.issue_summaries || []).map((issue) => {
    const examples = issue.examples.slice(0, ISSUE_EXAMPLE_LIMIT)
    return `
    <div class="issue"><h3>${escapeHtml(issue.category)} · ${issue.count}</h3><p>${escapeHtml(issue.remediation)}</p>${examples.length ? `<div class="quote-title">示例证据（最多 ${ISSUE_EXAMPLE_LIMIT} 条）</div>${examples.map((example) => `<div class="quote"><b>${escapeHtml(example.account_name)}</b>：${escapeHtml(example.evidence)}</div>`).join("")}` : ""}</div>
  `}).join("")

  const recs = (report.recommendations || []).map((rec, index) => `
    <div class="step"><div class="num">${index + 1}</div><h3>${escapeHtml(rec.title)}</h3><p>${escapeHtml(rec.description)}</p></div>
  `).join("")

  const violationCards = (report.video_results || [])
    .filter((row) => row.status === "violating")
    .map((row) => `
      <article class="detail-card" data-search="${escapeHtml(detailRowSearchText(row))}">
        <div class="detail-head">
          <div>
            <div class="detail-account">${escapeHtml(row.account_name)}</div>
            <a class="detail-title" href="${escapeHtml(row.url)}">${escapeHtml(row.post_title || row.url || "查看帖子")}</a>
            ${row.account_desc ? `<div class="detail-desc">${escapeHtml(row.account_desc)}</div>` : ""}
          </div>
          <div class="detail-tags">${row.violations.map((violation) => `<span class="tag">${escapeHtml(violation.risk_level)} · ${escapeHtml(violation.violation_type)}</span>`).join("")}</div>
        </div>
        <div class="violation-list">
          ${row.violations.map((violation) => `
            <div class="violation">
              <h3>${escapeHtml(violation.violation_type)}</h3>
              <div class="detail-grid">
                <div><b>证据</b><p>${escapeHtml(violation.evidence)}</p></div>
                <div><b>整改建议</b><p>${escapeHtml(violation.remediation)}</p></div>
              </div>
            </div>
          `).join("")}
        </div>
        ${row.transcript ? `<details class="transcript"><summary>查看原始转写文本</summary><p>${escapeHtml(row.transcript)}</p></details>` : ""}
      </article>
    `).join("")

  const supplementaryCards = (report.appendix?.supplementary_risk_reminders || []).map((reminder) => `
    <div class="issue"><h3>低风险补充 · ${escapeHtml(reminder.category)}</h3><p><b>${escapeHtml(reminder.account_name)}</b>${reminder.post_title ? ` · ${escapeHtml(reminder.post_title)}` : ""}</p>${reminder.evidence ? `<div class="quote">${escapeHtml(reminder.evidence)}</div>` : ""}${reminder.reason ? `<p>${escapeHtml(reminder.reason)}</p>` : ""}${reminder.remediation ? `<p><b>建议：</b>${escapeHtml(reminder.remediation)}</p>` : ""}</div>
  `).join("")

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(report.filename || "Batch Video Analysis")}</title><style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif;background:#eef3fb;color:#101828;line-height:1.5}header{position:sticky;top:0;background:rgba(255,255,255,.94);border-bottom:1px solid #e4e7ec}main,.topbar{max-width:1280px;margin:0 auto}.topbar{padding:14px 28px;font-weight:800;color:#123f86}main{padding:28px}.hero{background:#123f86;color:white;border-radius:20px;padding:32px}.hero h1{margin:0 0 10px;font-size:32px}.pill{display:inline-flex;margin:8px 8px 0 0;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.13);font-size:13px}section{margin-top:24px;background:white;border:1px solid #e4e7ec;border-radius:16px;overflow:visible}.head{padding:20px 24px;border-bottom:1px solid #e4e7ec}.head h2{margin:0;color:#123f86}.content{padding:24px}.grid{display:grid;gap:16px}.cols4{grid-template-columns:repeat(4,1fr)}.card{border:1px solid #e4e7ec;border-radius:14px;padding:18px}.label{color:#667085;font-size:13px}.value{font-size:32px;font-weight:800}.bar-row{display:grid;grid-template-columns:170px 1fr 64px;gap:12px;align-items:center;margin:12px 0}.bar-bg{height:12px;background:#f2f4f7;border-radius:999px;overflow:hidden}.bar{height:100%;background:#0b63ce}.tag{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef4ff;color:#123f86;font-size:12px;font-weight:700}.issue-list{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.issue{border:1px solid #e4e7ec;border-left:5px solid #0b63ce;border-radius:14px;padding:16px}.quote-title{margin-top:12px;color:#667085;font-size:12px;font-weight:800}.quote{margin-top:8px;padding:10px;background:#f9fafb;border-radius:10px;font-size:13px}.timeline{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}.step{border:1px solid #e4e7ec;border-radius:14px;padding:16px}.num{width:28px;height:28px;border-radius:50%;background:#123f86;color:white;display:flex;align-items:center;justify-content:center;font-weight:800}.search{margin-bottom:14px;width:min(420px,100%);box-sizing:border-box;border:1px solid #d0d5dd;border-radius:8px;padding:10px 12px;font-size:14px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e4e7ec;padding:12px;text-align:left;font-size:13px;vertical-align:top}th{background:#f8fafc}.detail-list{display:grid;gap:16px}.detail-card{border:1px solid #e4e7ec;border-radius:14px;padding:18px}.detail-head{display:grid;grid-template-columns:minmax(260px,1fr) minmax(220px,.7fr);gap:18px}.detail-account{font-weight:800}.detail-title{display:inline-block;margin-top:6px;color:#0b63ce;font-weight:700}.detail-desc{margin-top:6px;color:#667085;font-size:13px}.detail-tags{display:flex;align-content:flex-start;align-items:flex-start;flex-wrap:wrap;gap:6px}.violation-list{display:grid;gap:12px;margin-top:16px}.violation{border:1px solid #edf0f5;border-radius:12px;padding:14px;background:#fbfcff}.violation h3{margin:0 0 10px;font-size:15px}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.detail-grid b{font-size:12px;color:#667085}.detail-grid p{margin:4px 0 0}.transcript{margin-top:12px;color:#667085;font-size:13px}.transcript p{white-space:pre-wrap}.tooltip-container{position:relative;display:inline-block}.tooltip-container .tooltip-text{visibility:hidden;width:240px;background-color:#fff;color:#101828;text-align:left;border:1px solid #e4e7ec;border-radius:8px;padding:8px 12px;position:absolute;z-index:1;bottom:125%;left:0;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1),0 2px 4px -2px rgb(0 0 0 / 0.1);opacity:0;transition:opacity 0.1s;font-size:13px;font-weight:normal;text-decoration:none;white-space:normal}.tooltip-container:hover .tooltip-text{visibility:visible;opacity:1}@media(max-width:920px){.cols4,.issue-list,.timeline,.detail-head,.detail-grid{grid-template-columns:1fr}.bar-row{grid-template-columns:1fr}}</style></head><body>
    <header><div class="topbar">Batch Video Analysis</div></header><main>
    <div class="hero"><h1>${escapeHtml(report.filename || "未命名报告")}</h1>${report.audit_period ? `<p>${escapeHtml(report.audit_period)}</p>` : ""}<p>基于帖子标题、描述与口播文字进行合规审核。</p><span class="pill">审核量：${stats?.total_videos || 0} 条</span></div>
    <section><div class="head"><h2>审核整体概况 & 数据统计</h2></div><div class="content"><div class="grid cols4"><div class="card"><div class="label">总审核视频数量</div><div class="value">${stats?.total_videos || 0}</div></div><div class="card"><div class="label">可审核视频数</div><div class="value">${stats?.reviewable_videos || 0}</div></div><div class="card"><div class="label">高风险违规视频数</div><div class="value">${stats?.violating_videos || 0}</div></div><div class="card"><div class="label">高风险违规率</div><div class="value">${stats?.violation_rate || 0}%</div></div></div><div class="card" style="margin-top:16px"><h3>高风险违规大类分布</h3>${categoryRows || "<p>暂无高风险违规分类。</p>"}</div><div class="card">${escapeHtml(report.summary?.overall_conclusion)}</div></div></section>
    <section><div class="head"><h2>账号审核明细</h2></div><div class="content"><table><tr><th style="white-space:nowrap">账号名称</th><th style="white-space:nowrap">审核视频数</th><th style="white-space:nowrap">高风险违规条数</th><th style="white-space:nowrap">高风险违规率</th><th>账号问题摘要</th></tr>${accountRows}</table>${report.appendix?.compliant_accounts_note ? `<p>${escapeHtml(report.appendix.compliant_accounts_note)}</p>` : ""}</div></section>
    <section><div class="head"><h2>核心违规问题汇总 + 整改改进方案</h2></div><div class="content"><div class="issue-list">${issueCards || "<p>暂无核心违规问题。</p>"}</div></div></section>
    <section><div class="head"><h2>后续落地执行建议</h2></div><div class="content"><div class="timeline">${recs}</div></div></section>
    <section><div class="head"><h2>附录 A：高风险违规明细</h2></div><div class="content"><input class="search" id="detail-search" type="search" placeholder="Search account, title, transcript, evidence..."><div class="detail-list" id="detail-list">${violationCards || "<p>暂无高风险违规。</p>"}</div></div></section>
    <section><div class="head"><h2>附录 B：低风险补充提醒</h2></div><div class="content"><div class="issue-list">${supplementaryCards || "<p>暂无低风险补充提醒。</p>"}</div></div></section>
    </main><script>const input=document.getElementById("detail-search");const rows=[...document.querySelectorAll("#detail-list [data-search]")];input?.addEventListener("input",()=>{const q=input.value.trim().toLowerCase();rows.forEach((row)=>{row.style.display=!q||row.dataset.search.includes(q)?"":"none"})});</script></body></html>`
}

function downloadHTMLReport(report: BatchVideoReport) {
  const blob = new Blob([buildHtmlReport(report)], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${report.filename || "batch-video-analysis-report"}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function BatchVideoAnalysisPage() {
  const { profile } = useUserStore()
  const [sources, setSources] = useState<BatchVideoAnalysisSource[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string>("")
  const [report, setReport] = useState<BatchVideoReport | null>(null)
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<BatchVideoParseResult | null>(null)
  const [subtitle, setSubtitle] = useState("")
  const [videoLimit, setVideoLimit] = useState<number | "">("")
  const [auditCategories, setAuditCategories] = useState<AuditCategory[]>([])
  const [analysisTarget, setAnalysisTarget] = useState(DEFAULT_ANALYSIS_TARGET)
  const [auditRules, setAuditRules] = useState<string[]>([])
  const [accountSummaryPrompt, setAccountSummaryPrompt] = useState("")
  const [issueRemediationPrompt, setIssueRemediationPrompt] = useState("")
  const [finalRecommendationsPrompt, setFinalRecommendationsPrompt] = useState("")
  const [thinkingEnabled, setThinkingEnabled] = useState(false)
  const [accountFilter, setAccountFilter] = useState("all")
  const [keywordFilter, setKeywordFilter] = useState("")
  const [supplementaryAccountFilter, setSupplementaryAccountFilter] = useState("all")
  const [isLoadingSources, setIsLoadingSources] = useState(false)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [savedPreferences, setSavedPreferences] = useState<BatchVideoAnalysisPreferences | null>(null)
  const [analysisMessage, setAnalysisMessage] = useState("")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [showRiskCategoriesSheet, setShowRiskCategoriesSheet] = useState(false)
  const [showAuditRulesSheet, setShowAuditRulesSheet] = useState(false)
  const [showSynthesisSheet, setShowSynthesisSheet] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function refreshSources() {
    setIsLoadingSources(true)
    try {
      const response = await listBatchVideoAnalysisSources()
      setSources(response.sources || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load reports"))
    } finally {
      setIsLoadingSources(false)
    }
  }

  useEffect(() => {
    if (profile?.kawo_token) refreshSources()
  }, [profile?.kawo_token])

  useEffect(() => {
    if (!profile?.kawo_token) return
    let mounted = true
    setIsLoadingPreferences(true)
    getBatchVideoAnalysisPreferences()
      .then((preferences) => {
        if (!mounted) return
        setSavedPreferences(preferences)
        setAuditCategories(preferences.audit_categories)
        setAnalysisTarget(preferences.analysis_target)
        setAuditRules(preferences.judgment_rules)
        setAccountSummaryPrompt(preferences.account_summary_prompt)
        setIssueRemediationPrompt(preferences.issue_remediation_prompt)
        setFinalRecommendationsPrompt(preferences.final_recommendations_prompt)
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err : new Error("Failed to load report defaults"))
      })
      .finally(() => {
        if (mounted) setIsLoadingPreferences(false)
      })
    return () => {
      mounted = false
    }
  }, [profile?.kawo_token])

  useEffect(() => {
    if (!selectedSourceId) {
      setReport(null)
      return
    }
    let mounted = true
    async function loadReport() {
      setIsLoadingReport(true)
      try {
        const response = await getBatchVideoAnalysisReport<BatchVideoReport>(selectedSourceId)
        if (mounted) setReport(response)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error("Failed to load report"))
      } finally {
        if (mounted) setIsLoadingReport(false)
      }
    }
    loadReport()
    return () => {
      mounted = false
    }
  }, [selectedSourceId])

  useEffect(() => {
    if (!fileA || !fileB) {
      setParseResult(null)
      setIsParsing(false)
      return
    }

    let cancelled = false
    setIsParsing(true)
    setParseResult(null)
    setError(null)

    processBatchVideoFiles(fileA, fileB)
      .then((result) => {
        if (!cancelled) setParseResult(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setParseResult(null)
          setError(err instanceof Error ? err : new Error("Failed to parse JSON files"))
        }
      })
      .finally(() => {
        if (!cancelled) setIsParsing(false)
      })

    return () => {
      cancelled = true
    }
  }, [fileA, fileB])

  async function submitAnalysis() {
    if (!fileA || !fileB) return
    setIsAnalyzing(true)
    setAnalysisMessage("Checking uploaded JSON files...")
    setError(null)
    try {
      const parsed = parseResult?.records.length ? parseResult : await processBatchVideoFiles(fileA, fileB)
      setParseResult(parsed)
      if (!parsed.records.length) {
        throw new Error("No matching videos found between the DyItem links JSON and DyItemTask analysis JSON.")
      }
      setAnalysisMessage("Starting batch video analysis...")
      const target = analysisTarget.trim()
      if (!target) {
        throw new Error("Analysis target is required.")
      }
      const categories = auditCategories.map((category) => ({
        name: category.name.trim(),
        description: category.description.trim(),
      })).filter((category) => category.name && category.description)
      if (!categories.length) {
        throw new Error("At least one risk category with name and description is required.")
      }
      const rules = auditRules.map((rule) => rule.trim().replace(/^-\s*/, "")).filter(Boolean)
      if (!rules.length) {
        throw new Error("At least one judgment rule is required.")
      }
      const synthesisPrompts = [accountSummaryPrompt, issueRemediationPrompt, finalRecommendationsPrompt].map((prompt) => prompt.trim())
      if (synthesisPrompts.some((prompt) => !prompt)) {
        throw new Error("All three synthesis rules are required.")
      }
      setShowRiskCategoriesSheet(false)
      setShowAuditRulesSheet(false)
      setShowSynthesisSheet(false)
      const { job_id } = await createBatchVideoAnalysisJob({
        records: parsed.records,
        name: target,
        audit_period: subtitle.trim(),
        audit_categories: categories,
        analysis_target: target,
        judgment_rules: rules,
        account_summary_prompt: synthesisPrompts[0],
        issue_remediation_prompt: synthesisPrompts[1],
        final_recommendations_prompt: synthesisPrompts[2],
        limit: videoLimit === "" ? undefined : videoLimit,
        thinking_enabled: thinkingEnabled,
      })
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        const job = await pollBatchVideoAnalysisJob(job_id)
        if (job.status === "processing") {
          if (job.results?.message) setAnalysisMessage(job.results.message)
        } else if (job.status === "done" && job.results?.source_id) {
          await refreshSources()
          setSelectedSourceId(job.results.source_id)
          setShowUploadDialog(false)
          setIsAnalyzing(false)
          return
        } else if (job.status === "error") {
          throw new Error(job.error || "Batch video analysis failed")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Batch video analysis failed"))
      setIsAnalyzing(false)
    }
  }

  async function savePreferences() {
    setIsSavingPreferences(true)
    setError(null)
    try {
      const categories = auditCategories.map((category) => ({
        name: category.name.trim(),
        description: category.description.trim(),
      })).filter((category) => category.name && category.description)
      const rules = auditRules.map((rule) => rule.trim().replace(/^-\s*/, "")).filter(Boolean)
      const preferences = await updateBatchVideoAnalysisPreferences({
        audit_categories: categories,
        analysis_target: analysisTarget.trim(),
        judgment_rules: rules,
        account_summary_prompt: accountSummaryPrompt.trim(),
        issue_remediation_prompt: issueRemediationPrompt.trim(),
        final_recommendations_prompt: finalRecommendationsPrompt.trim(),
      })
      setSavedPreferences(preferences)
      setAuditCategories(preferences.audit_categories)
      setAnalysisTarget(preferences.analysis_target)
      setAuditRules(preferences.judgment_rules)
      setAccountSummaryPrompt(preferences.account_summary_prompt)
      setIssueRemediationPrompt(preferences.issue_remediation_prompt)
      setFinalRecommendationsPrompt(preferences.final_recommendations_prompt)
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to save report defaults"))
      return false
    } finally {
      setIsSavingPreferences(false)
    }
  }

  async function handleSavePreferenceChoice(save: boolean) {
    if (save && !(await savePreferences())) return
    setShowSaveConfirmation(false)
    await submitAnalysis()
  }

  async function handleDelete(sourceId: string) {
    await deleteBatchVideoAnalysisSource(sourceId)
    if (selectedSourceId === sourceId) setSelectedSourceId("")
    await refreshSources()
  }

  const detailRows = useMemo(() => {
    const keyword = keywordFilter.trim().toLowerCase()
    return (report?.video_results || [])
      .filter((row) => row.status === "violating")
      .filter((row) => {
        if (accountFilter !== "all" && row.account_name !== accountFilter) return false
        return !keyword || detailRowSearchText(row).includes(keyword)
      })
  }, [report?.video_results, accountFilter, keywordFilter])

  const accountSummaries = useMemo(() => report ? buildDisplayAccountSummaries(report) : [], [report])

  const accounts = useMemo(() => {
    return Array.from(new Set((report?.video_results || []).filter((row) => row.status === "violating").map((row) => row.account_name || "未知账号")))
  }, [report?.video_results])

  const supplementaryReminders = useMemo(
    () => report?.appendix?.supplementary_risk_reminders || [],
    [report?.appendix?.supplementary_risk_reminders],
  )
  const supplementaryAccounts = useMemo(() => {
    return Array.from(new Set(supplementaryReminders.map((reminder) => reminder.account_name || "未命名账号")))
  }, [supplementaryReminders])
  const filteredSupplementaryReminders = supplementaryReminders.filter((reminder) => (
    supplementaryAccountFilter === "all"
    || (reminder.account_name || "未命名账号") === supplementaryAccountFilter
  ))

  useEffect(() => {
    if (supplementaryAccountFilter !== "all" && !supplementaryAccounts.includes(supplementaryAccountFilter)) {
      setSupplementaryAccountFilter("all")
    }
  }, [supplementaryAccountFilter, supplementaryAccounts])

  const stats = report?.stats

  return (
    <div className="space-y-8 p-8 pt-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <Link href="/dashboard/analytics" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Analytics
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Batch Video Analysis</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSourceId && (
            <Button variant="outline" onClick={() => setSelectedSourceId("")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              History
            </Button>
          )}
          {report && (
            <Button variant="outline" onClick={() => downloadHTMLReport(report)} className="gap-2">
              <Download className="h-4 w-4" />
              Download HTML
            </Button>
          )}
        </div>
      </header>

      {error && <ErrorBanner message={error.message} onClose={() => setError(null)} />}

      {!selectedSourceId ? (
        <main className="space-y-6">
          {isLoadingSources ? (
            <LoadingState message="Loading reports..." />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">History Reports</h2>
                <span className="text-sm text-muted-foreground">{sources.length} saved</span>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setShowUploadDialog(true)}
                  className="group flex h-56 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-white/60 p-6 text-center transition hover:border-primary hover:bg-white hover:shadow-sm dark:bg-slate-900/60 dark:hover:bg-slate-900"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary/15">
                    <Plus className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block font-medium">New Report</span>
                    <span className="mt-1 block text-sm text-muted-foreground">Upload two JSON files</span>
                  </span>
                </button>
                {sources.map((source) => (
                  <div
                    key={source.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSourceId(source.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") setSelectedSourceId(source.id)
                    }}
                    className="group flex h-56 cursor-pointer flex-col justify-between rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-red-600"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDelete(source.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <h3 className="line-clamp-2 text-lg font-semibold">{source.name}</h3>
                      {source.audit_period ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{source.audit_period}</p>
                      ) : null}
                      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(source.updated_at)}
                      </div>
                    </div>
                    <div className="flex gap-4 border-t pt-4 text-sm text-muted-foreground">
                      <span>{source.video_count || 0} videos</span>
                      <span>{source.violation_count || 0} high-risk violations</span>
                    </div>
                  </div>
                ))}
              </div>
              {!sources.length && (
                <div className="rounded-lg border bg-white/70 p-8 text-center text-muted-foreground dark:bg-slate-900/60">
                  No history reports yet.
                </div>
              )}
            </>
          )}
        </main>
      ) : (
        <main className="space-y-6">
          {isLoadingReport ? (
            <LoadingState message="Loading report..." />
          ) : report && stats ? (
            <>
              <section className="overflow-hidden rounded-2xl bg-[#123f86] p-8 text-white shadow-sm">
                <h2 className="text-3xl font-bold">{report.filename || "未命名报告"}</h2>
                {report.audit_period ? (
                  <p className="mt-2 text-lg text-blue-50">{report.audit_period}</p>
                ) : null}
                <p className="mt-2 text-blue-100">基于帖子标题、描述与口播文字进行合规审核。</p>
                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/15 px-3 py-1">审核量：{stats.total_videos} 条</span>
                </div>
              </section>

              <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-[#123f86] dark:text-blue-400">审核整体概况 & 数据统计</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  {[
                    ["总审核视频数量", stats.total_videos],
                    ["可审核视频数", stats.reviewable_videos],
                    ["高风险违规视频数", stats.violating_videos],
                    ["高风险违规率", `${stats.violation_rate}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border p-4 dark:border-slate-800">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="mt-2 text-3xl font-bold">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-lg border p-4 dark:border-slate-800">
                  <h3 className="font-semibold">高风险违规大类分布</h3>
                  <div className="mt-3 space-y-3">
                    {Object.entries(stats.category_counts).filter(([, count]) => count > 0).map(([category, count]) => {
                      const totalCategoryCount = Object.values(stats.category_counts).reduce((sum, value) => sum + value, 0)
                      const pct = totalCategoryCount ? Math.round((count / totalCategoryCount) * 100) : 0
                      return (
                        <div key={category} className="grid items-center gap-3 text-sm md:grid-cols-[150px_1fr_52px]">
                          <span>{category}</span>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-[#0b63ce] dark:bg-blue-500" style={{ width: `${pct}%` }} />
                          </div>
                          <b>{pct}%</b>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <p className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-200">{report.summary?.overall_conclusion}</p>
              </section>

              <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-[#123f86] dark:text-blue-400">账号审核明细</h2>
                <div className="mt-4 overflow-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                      <tr><th className="p-3 text-left whitespace-nowrap">账号名称</th><th className="p-3 text-left whitespace-nowrap">审核视频数</th><th className="p-3 text-left whitespace-nowrap">高风险违规条数</th><th className="p-3 text-left whitespace-nowrap">高风险违规率</th><th className="p-3 text-left">账号问题摘要</th></tr>
                    </thead>
                    <tbody>
                      {accountSummaries.map((account) => (
                        <tr key={account.account_name} className="border-t dark:border-slate-800">
                          <td className="p-3">
                            {account.account_desc ? (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help underline decoration-dashed decoration-slate-300 underline-offset-4">
                                      {account.account_name}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{account.account_desc}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span>{account.account_name}</span>
                            )}
                          </td>
                          <td className="p-3">{account.reviewed_count}</td>
                          <td className="p-3">{account.violation_count}</td>
                          <td className="p-3">{formatPercent(account.violation_count, account.reviewed_count)}</td>
                          <td className="p-3">{account.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {report.appendix?.compliant_accounts_note && (
                  <p className="mt-3 text-sm text-muted-foreground">{report.appendix.compliant_accounts_note}</p>
                )}
              </section>

              <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-[#123f86] dark:text-blue-400">核心违规问题汇总 + 整改改进方案</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {(report.issue_summaries || []).map((issue) => (
                    <div key={issue.category} className="rounded-lg border border-l-4 border-l-[#0b63ce] p-4 dark:border-slate-800 dark:border-l-blue-500">
                      <h3 className="font-semibold">{issue.category} · {issue.count}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{issue.remediation}</p>
                      {issue.examples.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground">示例证据（最多 {ISSUE_EXAMPLE_LIMIT} 条）</div>
                          {issue.examples.slice(0, ISSUE_EXAMPLE_LIMIT).map((example) => (
                            <div key={`${example.item_id}-${example.evidence}`} className="rounded-md bg-slate-50 p-3 text-xs dark:bg-slate-800">
                              <span className="font-semibold">{example.account_name}</span>：{example.evidence}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-[#123f86] dark:text-blue-400">后续落地执行建议</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-5">
                  {(report.recommendations || []).map((rec, index) => (
                    <div key={rec.title} className="rounded-lg border p-4 dark:border-slate-800">
                      <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#123f86] text-sm font-bold text-white dark:bg-blue-500">{index + 1}</div>
                      <h3 className="font-semibold">{rec.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-[#123f86] dark:text-blue-400">附录 A：高风险违规明细</h2>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="w-[260px] pl-9" type="search" value={keywordFilter} onChange={(event) => setKeywordFilter(event.target.value)} placeholder="Search details" />
                    </div>
                    <select className="rounded-md border bg-background px-3 py-2 text-sm dark:border-slate-800" value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
                      <option value="all">全部账号</option>
                      {accounts.map((account) => <option key={account} value={account}>{account}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  {detailRows.map((row) => (
                    <article key={row.item_id} className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_minmax(240px,0.6fr)]">
                        <div>
                          <div className="text-sm font-semibold">{row.account_name}</div>
                          <a className="mt-1 block font-medium text-primary underline" href={row.url} target="_blank" rel="noreferrer">
                            {row.post_title || row.url || "查看帖子"}
                          </a>
                          {row.account_desc && <div className="mt-1 text-xs text-muted-foreground">{row.account_desc}</div>}
                        </div>
                        <div className="flex flex-wrap items-start gap-1">
                          {row.violations.map((violation) => (
                            <Badge key={`${row.item_id}-${violation.violation_type}-${violation.risk_level}`} className={riskClass(violation.risk_level)}>
                              {violation.risk_level} · {violation.violation_type}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {row.violations.map((violation) => (
                          <div key={`${row.item_id}-${violation.violation_type}-${violation.evidence}`} className="rounded-lg border bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                            <h3 className="font-medium">{violation.violation_type}</h3>
                            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">证据</div>
                                <p className="mt-1 text-sm">{violation.evidence}</p>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">整改建议</div>
                                <p className="mt-1 text-sm">{violation.remediation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {row.transcript && (
                        <details className="mt-3 text-sm text-muted-foreground">
                          <summary className="cursor-pointer font-medium">查看原始转写文本</summary>
                          <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">{row.transcript}</p>
                        </details>
                      )}
                    </article>
                  ))}
                  {!detailRows.length && <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No matching high-risk violations.</div>}
                </div>
              </section>

              <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-[#123f86] dark:text-blue-400">附录 B：低风险补充提醒</h2>
                  <select
                    value={supplementaryAccountFilter}
                    onChange={(event) => setSupplementaryAccountFilter(event.target.value)}
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                    aria-label="按账号筛选低风险补充提醒"
                  >
                    <option value="all">全部账号</option>
                    {supplementaryAccounts.map((accountName) => (
                      <option key={accountName} value={accountName}>{accountName}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">以下内容不计入违规统计，仅供发布前复核。</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {filteredSupplementaryReminders.map((reminder, index) => (
                    <div key={`${reminder.item_id}-${reminder.evidence}-${index}`} className="rounded-lg border border-l-4 border-l-amber-400 p-4 dark:border-slate-800 dark:border-l-amber-500">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">{reminder.category}</h3>
                        <Badge className={riskClass(reminder.risk_level)}>低风险补充</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{reminder.account_name}{reminder.post_title ? ` · ${reminder.post_title}` : ""}</p>
                      {reminder.evidence && <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">{reminder.evidence}</p>}
                      {reminder.reason && <p className="mt-2 text-sm text-muted-foreground">{reminder.reason}</p>}
                      {reminder.remediation && <p className="mt-2 text-sm"><span className="font-medium">建议：</span>{reminder.remediation}</p>}
                    </div>
                  ))}
                  {!filteredSupplementaryReminders.length && (
                    <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">当前筛选下暂无低风险补充提醒。</div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border bg-white/70 text-muted-foreground dark:bg-slate-900/60">
              Select a history report or create a new report.
            </div>
          )}
        </main>
      )}

      <Dialog open={showUploadDialog} onOpenChange={(open) => !isAnalyzing && setShowUploadDialog(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Batch Video Report</DialogTitle>
            <DialogDescription>
              Upload the Qingbo DyItem links JSON and DyItemTask analysis JSON.
            </DialogDescription>
          </DialogHeader>
          {isAnalyzing ? (
            <div className="flex min-h-[390px] flex-col items-center justify-center px-4 py-10 text-center">
              <div className="w-full max-w-md rounded-xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm dark:border-blue-900/70 dark:bg-blue-950/30">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Analysis in progress</h3>
                <p className="mt-2 min-h-10 text-sm text-muted-foreground" aria-live="polite">{analysisMessage || "Preparing your batch video report..."}</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">This can take a few minutes. Keep this window open while we prepare the report.</p>
              </div>
            </div>
          ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <label className="text-sm font-medium" htmlFor="batch-video-analysis-target">分析目标</label>
                <span className="text-xs text-muted-foreground">Used as the report title and in the prompt</span>
              </div>
              <Input
                id="batch-video-analysis-target"
                value={analysisTarget}
                onChange={(event) => setAnalysisTarget(event.target.value)}
                placeholder="例如：经销商短视频"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="batch-video-subtitle">Subtitle</label>
              <Input
                id="batch-video-subtitle"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                placeholder="Subtitle (optional)"
              />
            </div>
            <div className="overflow-hidden rounded-md border bg-slate-50/60 dark:bg-slate-900/40">
              <SettingsDrawerRow
                title="Risk categories"
                description={`${auditCategories.length} categories configured`}
                onEdit={() => setShowRiskCategoriesSheet(true)}
                disabled={isAnalyzing}
              />
              <div className="border-t" />
              <SettingsDrawerRow
                title="Audit rules"
                description={`${auditRules.filter((rule) => rule.trim()).length} rules · applied per post`}
                onEdit={() => setShowAuditRulesSheet(true)}
                disabled={isAnalyzing}
              />
              <div className="border-t" />
              <SettingsDrawerRow
                title="Synthesis rules"
                description="3 stages configured · account, issues, final report"
                onEdit={() => setShowSynthesisSheet(true)}
                disabled={isAnalyzing}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="batch-video-limit">Video limit</label>
                <Input
                  id="batch-video-limit"
                  type="number"
                  min={1}
                  value={videoLimit}
                  onChange={(event) => {
                    const val = event.target.value
                    if (val === "") {
                      setVideoLimit("")
                    } else {
                      setVideoLimit(Math.max(1, Number(val)))
                    }
                  }}
                  placeholder="No limit"
                  disabled={isAnalyzing}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="batch-video-thinking">Enable thinking</label>
                <label
                  htmlFor="batch-video-thinking"
                  className="flex h-10 cursor-pointer items-center justify-between gap-3 rounded-[8px] border border-input bg-background px-3 text-sm"
                >
                  <span className="text-muted-foreground">More reasoning time</span>
                  <input
                    id="batch-video-thinking"
                    type="checkbox"
                    checked={thinkingEnabled}
                    onChange={(event) => setThinkingEnabled(event.target.checked)}
                    disabled={isAnalyzing}
                    className="h-4 w-4 shrink-0 rounded border-slate-300"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Upload one DyItem links JSON and one DyItemTask analysis JSON. Either file can go in either slot.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-3 text-center text-sm transition hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <FileJson className="h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-2 break-all text-xs">{fileA?.name || "Choose first JSON"}</span>
                  <input type="file" accept=".json,application/json" className="hidden" onChange={(event) => setFileA(event.target.files?.[0] || null)} />
                </label>
                <label className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-3 text-center text-sm transition hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <FileJson className="h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-2 break-all text-xs">{fileB?.name || "Choose second JSON"}</span>
                  <input type="file" accept=".json,application/json" className="hidden" onChange={(event) => setFileB(event.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            {isParsing && (
              <div className="flex items-center gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Loader2 className="h-3 w-3 animate-spin" />
                Parsing uploaded JSON files...
              </div>
            )}
            {parseResult && (
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <div>Total links: {parseResult.totalLinks}</div>
                <div>Total tasks: {parseResult.totalTasks}</div>
                <div>Matched tasks: {parseResult.matchedTasks}</div>
                <div>Reviewable transcripts: {parseResult.reviewableTranscripts}</div>
                <div>Missing transcripts: {parseResult.missingTranscripts}</div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" disabled={isSavingPreferences} onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button disabled={!analysisTarget.trim() || !fileA || !fileB || isLoadingPreferences || isSavingPreferences} onClick={() => setShowSaveConfirmation(true)}>
                Run Analysis
              </Button>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveConfirmation} onOpenChange={(open) => !isSavingPreferences && setShowSaveConfirmation(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save these settings for future reports?</DialogTitle>
            <DialogDescription>
              Save the 分析目标 and report prompts as your defaults before running this analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" disabled={isSavingPreferences} onClick={() => handleSavePreferenceChoice(false)}>
              No, just run analysis
            </Button>
            <Button disabled={isSavingPreferences} onClick={() => handleSavePreferenceChoice(true)}>
              {isSavingPreferences ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Yes, save and run
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={showRiskCategoriesSheet} onOpenChange={(open) => !isAnalyzing && setShowRiskCategoriesSheet(open)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="border-b pr-10">
            <SheetTitle>Risk categories</SheetTitle>
            <SheetDescription>Define the risk categories used when auditing each post.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4 py-4">
            {auditCategories.map((category, index) => (
              <div key={index} className="space-y-2 rounded-md border bg-slate-50 p-3 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Category {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-destructive hover:text-destructive"
                    onClick={() => setAuditCategories((categories) => categories.filter((_, categoryIndex) => categoryIndex !== index))}
                    disabled={isAnalyzing}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
                <Input
                  value={category.name}
                  onChange={(event) => {
                    const next = [...auditCategories]
                    next[index] = { ...next[index], name: event.target.value }
                    setAuditCategories(next)
                  }}
                  placeholder="Category name"
                  disabled={isAnalyzing}
                />
                <Textarea
                  value={category.description}
                  onChange={(event) => {
                    const next = [...auditCategories]
                    next[index] = { ...next[index], description: event.target.value }
                    setAuditCategories(next)
                  }}
                  placeholder="Category definition"
                  rows={3}
                  disabled={isAnalyzing}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setAuditCategories((categories) => [...categories, { name: "", description: "" }])}
              disabled={isAnalyzing}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add risk category
            </Button>
          </div>
          <SheetFooter className="border-t">
            <Button type="button" onClick={() => setShowRiskCategoriesSheet(false)} disabled={isAnalyzing}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={showAuditRulesSheet} onOpenChange={(open) => !isAnalyzing && setShowAuditRulesSheet(open)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="border-b pr-10">
            <SheetTitle>Audit rules</SheetTitle>
            <SheetDescription>These rules are applied per post. Add, remove, and edit each rule independently.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4 py-4">
            {auditRules.map((rule, index) => (
              <div key={index} className="space-y-2 rounded-md border bg-slate-50 p-3 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor={`batch-video-audit-rule-${index}`}>Rule {index + 1}</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-destructive hover:text-destructive"
                    onClick={() => setAuditRules((rules) => rules.filter((_, ruleIndex) => ruleIndex !== index))}
                    disabled={isAnalyzing}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
                <Textarea
                  id={`batch-video-audit-rule-${index}`}
                  value={rule}
                  onChange={(event) => setAuditRules((rules) => rules.map((currentRule, ruleIndex) => ruleIndex === index ? event.target.value : currentRule))}
                  placeholder="Describe how this should be evaluated"
                  rows={4}
                  disabled={isAnalyzing}
                  className="resize-y leading-relaxed"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setAuditRules((rules) => [...rules, ""])}
              disabled={isAnalyzing}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add audit rule
            </Button>
            <div className="text-right text-xs text-muted-foreground">
              {auditRules.filter((rule) => rule.trim()).length} rules
            </div>
          </div>
          <SheetFooter className="border-t">
            <Button type="button" onClick={() => setShowAuditRulesSheet(false)} disabled={isAnalyzing}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={showSynthesisSheet} onOpenChange={(open) => !isAnalyzing && setShowSynthesisSheet(open)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="border-b pr-10">
            <SheetTitle>Synthesis rules</SheetTitle>
            <SheetDescription>Edit each report-writing stage independently. Output formats and source-grounding safeguards remain fixed.</SheetDescription>
          </SheetHeader>
          <Tabs defaultValue="account" className="flex-1 px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Accounts</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="final">Final report</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="space-y-3 pt-3">
              <PromptEditor
                title="Account summaries"
                description="Controls the note generated for each account with violations."
                value={accountSummaryPrompt}
                defaultValue={savedPreferences?.account_summary_prompt || ""}
                onChange={setAccountSummaryPrompt}
                disabled={isAnalyzing || !savedPreferences}
              />
            </TabsContent>
            <TabsContent value="issues" className="space-y-3 pt-3">
              <PromptEditor
                title="Issue remediation"
                description="Controls the remediation standard generated for each risk category."
                value={issueRemediationPrompt}
                defaultValue={savedPreferences?.issue_remediation_prompt || ""}
                onChange={setIssueRemediationPrompt}
                disabled={isAnalyzing || !savedPreferences}
              />
            </TabsContent>
            <TabsContent value="final" className="space-y-3 pt-3">
              <PromptEditor
                title="Final recommendations"
                description="Controls the management summary and recommended actions."
                value={finalRecommendationsPrompt}
                defaultValue={savedPreferences?.final_recommendations_prompt || ""}
                onChange={setFinalRecommendationsPrompt}
                disabled={isAnalyzing || !savedPreferences}
              />
            </TabsContent>
          </Tabs>
          <SheetFooter className="border-t">
            <Button type="button" onClick={() => setShowSynthesisSheet(false)} disabled={isAnalyzing}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
