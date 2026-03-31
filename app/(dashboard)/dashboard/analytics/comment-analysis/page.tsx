
"use client"

import { useEffect, useMemo, useState } from "react"
import { directApiCall } from "@/lib/api/client"
import { ErrorBanner } from "@/components/ui/error-banner"
import { LoadingState } from "@/components/ui/loading"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, FileText, Calendar, MessageSquare, BarChart3, Clock, Trash2, Download, Database, Layers, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileUploader } from "./file-uploader"
import { AnalysisProgress } from "./analysis-progress"
import { TopicAnalysis } from "./topic-analysis"
import { DimensionAnalysis } from "./dimension-analysis"
import { CommentList } from "./comment-list"
import { createAnalysisJob, createBatchAnalysisJob, getJobProgress, pollJob } from "@/lib/api/content-analysis"
import { sentimentLabel, sentimentColor, sentimentBadgeClass } from "@/lib/utils/sentiment"
import type { ProcessedComment } from "@/lib/utils/file-processor"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/lib/store/user-store"
import type { AnalysisModelModes } from "./file-uploader"

type DataSource = {
  id: string
  name: string
  description?: string
  updated_at?: string
  comment_count?: number
  filename?: string
  is_batch?: boolean
}

type Summary = {
  total_reviews: number
  tagged_reviews: number
  persona_count: number
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
  is_batch?: boolean
  summary: Summary
  insights?: Insights
  personas?: Persona[]
  sentiment_distribution?: Record<string, number>
  tag_statistics?: Record<string, number>
  topic_distribution?: Record<string, number>
  tagged_data?: any[]
  schema_snapshot?: {
    dimensions: SchemaDimension[]
  }
}

const EXCLUDED_TAG_VALUES = new Set(["Unknown", "unknown", "不明", "未提及", "nan", "None"])
const ANALYSIS_POLL_INTERVAL_MS = 10000

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

function getNormalizedSentimentDistribution(dist?: Record<string, number>) {
  if (!dist) return null
  const normalized: Record<string, number> = { positive: 0, neutral: 0, negative: 0 }
  Object.entries(dist).forEach(([key, count]) => {
    const k = String(key).toLowerCase()
    if (k === "1" || k === "positive" || k === "正面") normalized.positive += count
    else if (k === "-1" || k === "negative" || k === "负面") normalized.negative += count
    else normalized.neutral += count
  })
  return normalized
}

function downloadJSONData(report: CommentAnalysisReport) {
  const baseName = report.filename ? report.filename.replace(/\.[^/.]+$/, "") : "analysis"

  const download = (data: any, suffix: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${baseName}-${suffix}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (report.schema_snapshot?.dimensions) {
    download(report.schema_snapshot.dimensions, "dimensions")
  }
  if (report.tagged_data) {
    setTimeout(() => download(report.tagged_data, "tagged-comments"), 500)
  }
  if (report.insights) {
    setTimeout(() => download(report.insights, "insights"), 1000)
  }
}

function downloadHTMLReport(report: CommentAnalysisReport) {
  const taggedDataJson = JSON.stringify(report.tagged_data || [])
  const personasJson = JSON.stringify(report.personas || [])
  const schemaSnapshotJson = JSON.stringify(report.schema_snapshot || { dimensions: [] })
  
  const normSentimentDist = getNormalizedSentimentDistribution(report.sentiment_distribution)
  const totalSentiment = normSentimentDist
    ? Object.values(normSentimentDist).reduce((sum, value) => sum + value, 0)
    : 0

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.filename || "Comment Analysis Report"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
    h1 { font-size: 2rem; font-weight: 600; margin-bottom: 8px; }
    h2 { font-size: 1.5rem; font-weight: 600; margin-bottom: 16px; }
    h3 { font-size: 1.125rem; font-weight: 500; }
    .subtitle { color: #64748b; font-size: 0.875rem; margin-bottom: 32px; }
    .section { margin-bottom: 48px; }
    .section-header { display: flex; align-items: baseline; gap: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    .section-number { font-size: 2.5rem; font-weight: 300; color: #c7d2fe; }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card { position: relative; overflow: hidden; padding: 20px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; }
    .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
    .stat-value { font-size: 2rem; font-weight: 600; margin-top: 8px; }
    .stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
    .sentiment-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .sentiment-label { min-width: 100px; color: #64748b; font-size: 0.875rem; }
    .sentiment-bar-bg { flex: 1; height: 24px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .sentiment-bar-fill { height: 100%; border-radius: 4px; }
    .sentiment-count { min-width: 80px; text-align: right; font-family: monospace; font-size: 0.875rem; }
    .persona-card { background: linear-gradient(135deg, #fff 0%, #f8fafc 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
    .persona-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .persona-name { font-size: 1.125rem; font-weight: 500; }
    .persona-count { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-family: monospace; }
    .persona-desc { color: #64748b; font-size: 0.875rem; margin-bottom: 8px; }
    .persona-meta { font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; }
    .tag { display: inline-block; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; margin: 2px; }
    .topic-tag { display: inline-block; background: #eef2ff; border: 1px solid #c7d2fe; color: #4f46e5; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; margin: 2px; }
    .insight-item { border-left: 3px solid; padding-left: 16px; margin-bottom: 16px; }
    .insight-strength { border-color: #34d399; }
    .insight-pain { border-color: #fb7185; }
    .insight-suggestion { border-color: #818cf8; }
    .insight-point { font-weight: 500; font-size: 0.875rem; }
    .insight-evidence { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
    .severity { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.625rem; font-weight: 500; text-transform: uppercase; }
    .severity-high { background: #ffe4e6; color: #e11d48; }
    .severity-medium { background: #fef3c7; color: #d97706; }
    .priority { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.625rem; font-weight: 500; text-transform: uppercase; }
    .priority-high { background: #eef2ff; color: #4f46e5; }
    .priority-medium { background: #e0f2fe; color: #0284c7; }
    .sentiment-badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; }
    .info-score { background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-family: monospace; }
    footer { border-top: 1px solid #e2e8f0; padding-top: 40px; text-align: center; font-size: 0.75rem; color: #94a3b8; }
    .generated-by { font-family: serif; font-size: 1.125rem; color: #4f46e5; margin-bottom: 8px; }
    .filter-bar { background: white; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .filter-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
    .filter-row:last-child { margin-bottom: 0; }
    .filter-label { font-size: 0.75rem; color: #64748b; min-width: 60px; }
    .filter-btn { padding: 6px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer; transition: all 0.15s; }
    .filter-btn:hover { background: #f1f5f9; }
    .filter-btn.active { background: #4f46e5; color: white; border-color: #4f46e5; }
    .filter-btn.sentiment-pos { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .filter-btn.sentiment-pos.active { background: #22c55e; color: white; border-color: #22c55e; }
    .filter-btn.sentiment-neg { background: #ffe4e6; color: #e11d48; border-color: #fecdd3; }
    .filter-btn.sentiment-neg.active { background: #ef4444; color: white; border-color: #ef4444; }
    .filter-btn.sentiment-neu { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
    .filter-btn.sentiment-neu.active { background: #94a3b8; color: white; border-color: #94a3b8; }
    .comments-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .comments-table th { padding: 12px 16px; text-align: left; font-weight: 500; color: #64748b; font-size: 0.75rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; cursor: pointer; }
    .comments-table th:hover { background: #f1f5f9; }
    .comments-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
    .comments-table tr:hover td { background: #fafafa; }
    .sort-icon { margin-left: 4px; opacity: 0.5; }
    .sort-icon.active { opacity: 1; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 16px; }
    .page-btn { padding: 6px 12px; border-radius: 6px; font-size: 0.875rem; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer; }
    .page-btn:hover { background: #f1f5f9; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .results-count { font-size: 0.875rem; color: #64748b; margin-bottom: 12px; }
    .topic-card { background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer; transition: box-shadow 0.15s; }
    .topic-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .topic-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .topic-name { font-weight: 500; font-size: 0.9rem; }
    .topic-stats { font-size: 0.75rem; color: #64748b; }
    .topic-bar { height: 6px; border-radius: 3px; overflow: hidden; background: #e2e8f0; display: flex; }
    .topic-bar-segment { height: 100%; }
    .topic-expand { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; display: none; }
    .topic-expand.show { display: block; }
    .topic-comment { padding: 8px; background: #f8fafc; border-radius: 6px; margin-bottom: 6px; font-size: 0.8rem; }
    .topic-comment:last-child { margin-bottom: 0; }
    .dim-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .dim-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .dim-name { font-weight: 600; font-size: 0.875rem; margin-bottom: 4px; color: #4f46e5; }
    .dim-desc { font-size: 0.75rem; color: #94a3b8; margin-bottom: 12px; }
    .dim-option { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .dim-option-label { font-size: 0.8rem; min-width: 100px; color: #475569; }
    .dim-bar-track { flex: 1; height: 14px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .dim-bar-fill { height: 100%; border-radius: 3px; }
    .dim-count { font-size: 0.75rem; font-family: monospace; color: #64748b; min-width: 36px; text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${report.filename || "Comment Analysis Report"}</h1>
    <p class="subtitle">${report.summary.total_reviews} reviews · ${report.analysis_date ? formatAnalysisDate(report.analysis_date) : ""}</p>

    <div class="section">
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-label">Total Reviews</div>
          <div class="stat-value">${report.summary.total_reviews}<span style="font-size: 0.875rem; color: #94a3b8;"> items</span></div>
          <div class="stat-accent" style="background: #38bdf8;"></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tagged</div>
          <div class="stat-value">${report.summary.tagged_reviews}<span style="font-size: 0.875rem; color: #94a3b8;"> items</span></div>
          <div class="stat-accent" style="background: #34d399;"></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Personas</div>
          <div class="stat-value">${report.summary.persona_count}<span style="font-size: 0.875rem; color: #94a3b8;"> types</span></div>
          <div class="stat-accent" style="background: #a78bfa;"></div>
        </div>
      </div>
    </div>

    ${report.insights && !report.insights.error ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">01</span>
        <div>
          <h2>Strategic Insights</h2>
          <p class="subtitle">AI-generated comprehensive analysis</p>
        </div>
      </div>

      ${report.insights.overview ? `<div class="card">${report.insights.overview}</div>` : ''}

      ${report.insights.strengths && report.insights.strengths.length ? `
      <div class="card">
        <h3 style="margin-bottom: 16px;">Strengths</h3>
        ${report.insights.strengths.map(s => `
          <div class="insight-item insight-strength">
            <p class="insight-point">${s.point}</p>
            <p class="insight-evidence" style="font-style: italic;">${s.evidence}</p>
            ${s.keywords && s.keywords.length ? `<div style="margin-top: 8px;">${s.keywords.map(kw => `<span class="tag" style="background: #dcfce7; color: #166534; border-color: #bbf7d0;">${kw}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${report.insights.pain_points && report.insights.pain_points.length ? `
      <div class="card">
        <h3 style="margin-bottom: 16px;">Pain Points</h3>
        ${report.insights.pain_points.map(p => `
          <div class="insight-item insight-pain">
            <p class="insight-point">${p.point} <span class="severity severity-${p.severity.toLowerCase()}">${p.severity}</span></p>
            <p class="insight-evidence">${p.root_cause}</p>
            <p class="insight-evidence" style="font-style: italic;">${p.evidence}</p>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${report.insights.suggestions && report.insights.suggestions.length ? `
      <div class="card">
        <h3 style="margin-bottom: 16px;">Suggestions</h3>
        ${report.insights.suggestions.map(s => `
          <div class="insight-item insight-suggestion">
            <p class="insight-point">${s.suggestion} <span class="priority priority-${s.priority.toLowerCase()}">${s.priority}</span></p>
            <p class="insight-evidence">${s.expected_roi}</p>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    ` : ''}

    ${normSentimentDist ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">02</span>
        <div>
          <h2>Sentiment & Topic Distribution</h2>
          <p class="subtitle">Distribution of customer sentiment and topics</p>
        </div>
      </div>
      <div class="grid-4" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
        <div class="card">
          <h3 style="margin-bottom: 16px;">Sentiment</h3>
          ${Object.entries(normSentimentDist).map(([label, count]) => {
            const percent = totalSentiment ? Math.round((count / totalSentiment) * 1000) / 10 : 0
            const colors: Record<string, string> = { positive: '#22c55e', neutral: '#94a3b8', negative: '#ef4444' }
            const displayLabel = label.charAt(0).toUpperCase() + label.slice(1)
            return `
            <div class="sentiment-bar">
              <span class="sentiment-label">${displayLabel}</span>
              <div class="sentiment-bar-bg">
                <div class="sentiment-bar-fill" style="width: ${percent}%; background: ${colors[label] || '#94a3b8'};"></div>
              </div>
              <span class="sentiment-count">${count} (${percent}%)</span>
            </div>
          `}).join('')}
        </div>
        <div class="card" id="topic-dist-card">
          <h3 style="margin-bottom: 16px;">Topics</h3>
          <!-- Filled by JS -->
        </div>
      </div>
    </div>
    ` : ''}

    ${report.personas && report.personas.length ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">03</span>
        <div>
          <h2>User Personas</h2>
          <p class="subtitle">Identified ${report.personas.length} key customer profiles</p>
        </div>
      </div>
      <div class="grid-4">
        ${report.personas.map(persona => `
          <div class="persona-card">
            <div class="persona-header">
              <span class="persona-name">${persona.name}</span>
              <span class="persona-count" style="color: ${persona.color || '#6366f1'};">${persona.count} users</span>
            </div>
            ${persona.description ? `<p class="persona-desc">${persona.description}</p>` : ''}
            ${persona.scenario ? `<p class="persona-meta"><strong>Scenario:</strong> ${persona.scenario}</p>` : ''}
            ${persona.core_need ? `<p class="persona-meta"><strong>Core Need:</strong> ${persona.core_need}</p>` : ''}
            ${persona.analysis ? `<p class="persona-meta"><strong>Analysis:</strong> ${persona.analysis}</p>` : ''}
            ${Object.keys(persona.tags).length ? `<div style="margin-top: 12px;">${Object.entries(persona.tags).filter(([, v]) => v && !EXCLUDED_TAG_VALUES.has(v)).map(([k, v]) => `<span class="tag">${k}: ${v}</span>`).join('')}</div>` : ''}
            ${persona.topic_labels && persona.topic_labels.length ? `<div style="margin-top: 8px;">${persona.topic_labels.map(t => `<span class="topic-tag">${t}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${report.tagged_data && report.tagged_data.length && report.schema_snapshot?.dimensions?.length ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">04</span>
        <div>
          <h2>Dimension Analysis</h2>
          <p class="subtitle">Distribution of ${report.schema_snapshot.dimensions.length} analysis dimensions</p>
        </div>
      </div>
      <div id="dim-container"></div>
    </div>
    ` : ''}

    ${report.tagged_data && report.tagged_data.length ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">05</span>
        <div>
          <h2>All Comments</h2>
          <p class="subtitle" id="comments-count">${report.tagged_data.length} comments</p>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-row">
          <span class="filter-label">Sentiment</span>
          <button class="filter-btn sentiment-pos active" data-filter="sentiment" data-value="all">All</button>
          <button class="filter-btn sentiment-pos" data-filter="sentiment" data-value="positive">Positive</button>
          <button class="filter-btn sentiment-neu" data-filter="sentiment" data-value="neutral">Neutral</button>
          <button class="filter-btn sentiment-neg" data-filter="sentiment" data-value="negative">Negative</button>
        </div>
        <div class="filter-row" id="persona-filters">
          <span class="filter-label">Persona</span>
          <button class="filter-btn active" data-filter="persona" data-value="all">All</button>
        </div>
        <div id="dimension-filter-rows"></div>
        <div class="filter-row" id="topic-filters">
          <span class="filter-label">Topic</span>
          <button class="filter-btn active" data-filter="topic" data-value="all">All</button>
        </div>
        <div class="filter-row">
          <span class="filter-label">Sort by</span>
          <button class="filter-btn active" data-sort="combined" data-order="desc">Score ↓</button>
          <button class="filter-btn" data-sort="info_score" data-order="desc">Info ↓</button>
          <button class="filter-btn" data-sort="likes" data-order="desc">Likes ↓</button>
          <button class="filter-btn" data-sort="replies" data-order="desc">Replies ↓</button>
        </div>
        <div class="filter-row" id="slider-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
          <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;">
            <label style="font-size:0.75rem;color:#64748b;display:flex;align-items:center;gap:6px;">
              👍 ÷ <input type="range" id="likes-div" min="1" max="200" value="50" style="width:80px;">
              <span id="likes-div-val" style="font-family:monospace;font-weight:700;color:#4f46e5;min-width:28px;">50</span>
            </label>
            <label style="font-size:0.75rem;color:#64748b;display:flex;align-items:center;gap:6px;">
              💬 ÷ <input type="range" id="replies-div" min="1" max="50" value="10" style="width:80px;">
              <span id="replies-div-val" style="font-family:monospace;font-weight:700;color:#4f46e5;min-width:28px;">10</span>
            </label>
            <label style="font-size:0.75rem;color:#64748b;display:flex;align-items:center;gap:6px;">
              ⭐ weight <input type="range" id="info-weight" min="0" max="10" value="5" style="width:80px;">
              <span id="info-weight-val" style="font-family:monospace;font-weight:700;color:#4f46e5;min-width:28px;">0.5</span>
            </label>
          </div>
          <code id="formula-preview" style="font-size:0.7rem;color:#94a3b8;">score = 0.5 × info_score + 0.5 × (likes/50 + replies/10)</code>
        </div>
      </div>

      <p class="results-count" id="results-count"></p>
      <div class="card" style="padding: 0; overflow: hidden;">
        <table class="comments-table">
          <thead>
            <tr>
              <th data-sort="sentiment">Sentiment <span class="sort-icon">↕</span></th>
              <th style="width: 50%;">Comment</th>
              <th data-sort="persona_name">Persona <span class="sort-icon">↕</span></th>
              <th data-sort="info_score">Score <span class="sort-icon">↕</span></th>
            </tr>
          </thead>
          <tbody id="comments-tbody"></tbody>
        </table>
      </div>
      <div class="pagination" id="pagination"></div>
    </div>
    ` : ''}

    <footer>
      <p class="generated-by">Generated by AI</p>
      ${report.analysis_date ? `<p>${formatAnalysisDate(report.analysis_date)}</p>` : ''}
    </footer>
  </div>

  <script>
    const EXCLUDED_VALUES = new Set(["Unknown", "unknown", "不明", "未提及", "nan", "None", "其他", "other", ""]);
    const data = ${taggedDataJson};
    const personas = ${personasJson};
    const schema = ${schemaSnapshotJson};
    const PAGE_SIZE = 50;

    let state = {
      sentiment: 'all',
      persona: 'all',
      topic: 'all',
      dimensions: {},   // { dimKey: selectedValue | 'all' }
      sortBy: 'combined',
      sortOrder: 'desc',
      page: 1,
      likesDiv: 50,
      repliesDiv: 10,
      infoWeight: 0.5,
      selectedDimension: null,
      expandedOption: null,
    };

    function normalizeSentiment(sent) {
      if (sent === 1 || sent === '1' || sent === 'positive' || sent === '正面') return 'positive';
      if (sent === -1 || sent === '-1' || sent === 'negative' || sent === '负面') return 'negative';
      return 'neutral';
    }

    function getSentimentBadge(rawSent) {
      const sent = normalizeSentiment(rawSent);
      const colors = { positive: '#dcfce7', neutral: '#f1f5f9', negative: '#ffe4e6' };
      const textColors = { positive: '#166534', neutral: '#475569', negative: '#e11d48' };
      const bg = colors[sent] || colors.neutral;
      const tc = textColors[sent] || textColors.neutral;
      const label = sent.charAt(0).toUpperCase() + sent.slice(1);
      return '<span class="sentiment-badge" style="background:' + bg + ';color:' + tc + ';">' + label + '</span>';
    }

    function renderSentimentBar(counts, total) {
      if (!total) return '';
      const posPct = (counts.positive || 0) / total * 100;
      const neuPct = (counts.neutral || 0) / total * 100;
      const negPct = (counts.negative || 0) / total * 100;
      return '<div style="display:flex; height:6px; width:80px; border-radius:3px; overflow:hidden; background:#e2e8f0;">' +
             '<div style="width:' + posPct + '%; background:#22c55e;"></div>' +
             '<div style="width:' + neuPct + '%; background:#94a3b8;"></div>' +
             '<div style="width:' + negPct + '%; background:#ef4444;"></div>' +
             '</div>';
    }

    function getUniqueValues(field) {
      const vals = new Set();
      data.forEach(d => { 
        const val = d.tags && d.tags[field] ? d.tags[field] : d[field];
        if (val && !EXCLUDED_VALUES.has(val)) vals.add(val); 
      });
      return Array.from(vals).sort();
    }

    function combinedScore(item) {
      const eng = (item.likes || 0) / state.likesDiv + (item.replies || 0) / state.repliesDiv;
      return state.infoWeight * (item.info_score || 0) + (1 - state.infoWeight) * eng;
    }

    function updateFormulaPreview() {
      const el = document.getElementById('formula-preview');
      if (el) el.textContent = 'score = ' + state.infoWeight.toFixed(1) + ' × info_score + ' + (1 - state.infoWeight).toFixed(1) + ' × (likes/' + state.likesDiv + ' + replies/' + state.repliesDiv + ')';
    }

    function initFilters() {
      // Persona filter buttons
      const pfRow = document.getElementById('persona-filters');
      if (pfRow) {
        getUniqueValues('persona_name').forEach(p => {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.dataset.filter = 'persona';
          btn.dataset.value = p;
          btn.textContent = p;
          pfRow.appendChild(btn);
        });
      }

      // Topic filter buttons
      const topicRow = document.getElementById('topic-filters');
      if (topicRow) {
        const topics = getUniqueValues('topic');
        if (topics.length > 0) {
          topics.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.filter = 'topic';
            btn.dataset.value = t;
            btn.textContent = t;
            topicRow.appendChild(btn);
          });
        } else {
          topicRow.style.display = 'none';
        }
      }

      // Dimension filter rows (one per dimension)
      const dimContainer = document.getElementById('dimension-filter-rows');
      if (dimContainer && schema.dimensions) {
        schema.dimensions.forEach(dim => {
          const validOpts = (dim.options || []).filter(o => o && !EXCLUDED_VALUES.has(o) && data.some(d => {
            const val = d.tags ? d.tags[dim.key] : d[dim.key];
            return val === o;
          }));
          if (!validOpts.length) return;
          state.dimensions[dim.key] = 'all';
          const row = document.createElement('div');
          row.className = 'filter-row';
          row.id = 'dim-filter-' + dim.key;
          const label = document.createElement('span');
          label.className = 'filter-label';
          label.textContent = dim.key;
          label.title = dim.description || '';
          row.appendChild(label);
          const allBtn = document.createElement('button');
          allBtn.className = 'filter-btn active';
          allBtn.dataset.dimFilter = dim.key;
          allBtn.dataset.value = 'all';
          allBtn.textContent = 'All';
          row.appendChild(allBtn);
          validOpts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.dimFilter = dim.key;
            btn.dataset.value = opt;
            btn.textContent = opt;
            row.appendChild(btn);
          });
          dimContainer.appendChild(row);
        });
      }

      // Slider listeners
      const sliderRow = document.getElementById('slider-row');
      if (sliderRow) {
        document.getElementById('likes-div').addEventListener('input', function() {
          state.likesDiv = parseFloat(this.value);
          document.getElementById('likes-div-val').textContent = this.value;
          updateFormulaPreview(); renderComments();
        });
        document.getElementById('replies-div').addEventListener('input', function() {
          state.repliesDiv = parseFloat(this.value);
          document.getElementById('replies-div-val').textContent = this.value;
          updateFormulaPreview(); renderComments();
        });
        document.getElementById('info-weight').addEventListener('input', function() {
          state.infoWeight = parseFloat(this.value) / 10;
          document.getElementById('info-weight-val').textContent = state.infoWeight.toFixed(1);
          updateFormulaPreview(); renderComments();
        });
      }
    }

    function getFiltered() {
      return data.filter(d => {
        const itemSent = normalizeSentiment(d.sentiment);
        if (state.sentiment !== 'all' && itemSent !== state.sentiment) return false;
        if (state.persona !== 'all' && d.persona_name !== state.persona) return false;
        const itemTopic = d.tags && d.tags.topic ? d.tags.topic : d.topic;
        if (state.topic !== 'all' && itemTopic !== state.topic) return false;
        for (const [key, val] of Object.entries(state.dimensions)) {
          const itemVal = d.tags ? d.tags[key] : d[key];
          if (val !== 'all' && itemVal !== val) return false;
        }
        return true;
      }).sort((a, b) => {
        if (state.sortBy === 'combined') {
          const diff = combinedScore(b) - combinedScore(a);
          return state.sortOrder === 'desc' ? diff : -diff;
        }
        let va = a[state.sortBy], vb = b[state.sortBy];
        if (va === undefined || va === null) va = 0;
        if (vb === undefined || vb === null) vb = 0;
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return state.sortOrder === 'asc' ? -1 : 1;
        if (va > vb) return state.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    function renderComments() {
      const filtered = getFiltered();
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (state.page > totalPages) state.page = 1;
      const start = (state.page - 1) * PAGE_SIZE;
      const pageItems = filtered.slice(start, start + PAGE_SIZE);

      document.getElementById('results-count').textContent = 'Showing ' + pageItems.length + ' of ' + filtered.length + ' results';
      document.getElementById('comments-count').textContent = filtered.length + ' comments';

      const tbody = document.getElementById('comments-tbody');
      if (!tbody) return;
      tbody.innerHTML = pageItems.map(item => {
        const score = state.sortBy === 'combined' ? combinedScore(item).toFixed(2) : (item.info_score !== undefined ? item.info_score + '/10' : '-');
        
        let tagsHtml = '';
        if (item.topic || (item.tags && item.tags.topic)) {
          tagsHtml += '<span class="topic-tag">' + (item.topic || item.tags.topic) + '</span> ';
        }
        if (schema && schema.dimensions) {
          schema.dimensions.forEach(dim => {
            const val = item.tags ? item.tags[dim.key] : item[dim.key];
            if (val && !EXCLUDED_VALUES.has(val)) {
              tagsHtml += '<span class="tag">' + dim.key + ': ' + val + '</span> ';
            }
          });
        }

        return '<tr>' +
          '<td>' + getSentimentBadge(item.sentiment) + '</td>' +
          '<td style="max-width:300px;">' +
            '<span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + (item.body || '') + '</span>' +
            (tagsHtml ? '<div style="margin-top:8px;">' + tagsHtml + '</div>' : '') +
          '</td>' +
          '<td>' + (item.persona_name || '-') + '</td>' +
          '<td style="text-align:right;font-family:monospace;">' + score + '</td>' +
          '</tr>';
      }).join('');

      const pag = document.getElementById('pagination');
      if (!pag) return;
      pag.innerHTML = '<button class="page-btn" onclick="prevPage()" ' + (state.page <= 1 ? 'disabled' : '') + '>← Prev</button>' +
        '<span style="font-size:0.875rem;color:#64748b;">Page ' + state.page + ' of ' + totalPages + '</span>' +
        '<button class="page-btn" onclick="nextPage()" ' + (state.page >= totalPages ? 'disabled' : '') + '>Next →</button>';
    }

    function renderTopicDist() {
      const el = document.getElementById('topic-dist-card');
      if (!el) return;
      const topics = {};
      let total = 0;
      data.forEach(d => {
        const t = d.tags && d.tags.topic ? d.tags.topic : d.topic;
        const topicName = t && !EXCLUDED_VALUES.has(t) ? t : 'Uncategorized';
        topics[topicName] = (topics[topicName] || 0) + 1;
        total++;
      });
      const sorted = Object.entries(topics).sort((a, b) => b[1] - a[1]);
      
      let html = '<h3 style="margin-bottom: 16px;">Topics</h3>';
      if (total === 0 || sorted.length === 0) {
        html += '<p style="color:#94a3b8; font-size:0.875rem;">No topics available</p>';
      } else {
        html += '<div style="display:flex; flex-direction:column; gap:12px;">';
        sorted.forEach(([topic, count]) => {
          const pct = Math.round((count / total) * 1000) / 10;
          html += '<div style="display:flex; align-items:center; gap:12px;">' +
              '<span style="min-width:100px; color:#64748b; font-size:0.875rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + topic + '">' + topic + '</span>' +
              '<div style="flex:1; height:24px; background:#e2e8f0; border-radius:4px; overflow:hidden;">' +
                '<div style="height:100%; border-radius:4px; width:' + pct + '%; background:#6366f1;"></div>' +
              '</div>' +
              '<span style="min-width:80px; text-align:right; font-family:monospace; font-size:0.875rem;">' + count + ' (' + pct + '%)</span>' +
            '</div>';
        });
        html += '</div>';
      }
      el.innerHTML = html;
    }

    function prevPage() { state.page--; renderComments(); }
    function nextPage() { state.page++; renderComments(); }

    function renderDimensions() {
      const container = document.getElementById('dim-container');
      if (!container || !schema.dimensions) return;

      if (!state.selectedDimension) {
        let html = '<div class="dim-grid">';
        schema.dimensions.forEach(dim => {
          let count = 0;
          const sentCounts = { positive: 0, neutral: 0, negative: 0 };
          data.forEach(item => {
            const val = item.tags ? item.tags[dim.key] : item[dim.key];
            if (val && !EXCLUDED_VALUES.has(val)) {
              count++;
              sentCounts[normalizeSentiment(item.sentiment)]++;
            }
          });

          const optsHtml = (dim.options || []).slice(0, 5).map(o => '<span class="tag">' + o + '</span>').join('');
          const moreOpts = dim.options && dim.options.length > 5 ? '<span class="tag">+' + (dim.options.length - 5) + '</span>' : '';

          html += '<div class="dim-card" style="cursor:pointer; transition:all 0.2s;" onclick="selectDimension(\\'' + dim.key + '\\')" onmouseover="this.style.boxShadow=\\'0 4px 12px rgba(0,0,0,0.1)\\';" onmouseout="this.style.boxShadow=\\'0 1px 3px rgba(0,0,0,0.1)\\';">' +
              '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">' +
                '<div>' +
                  '<div class="dim-name" style="color:#1e293b; font-size:1rem;">' + dim.key + '</div>' +
                  '<div class="dim-desc" style="margin-bottom:0;">' + (dim.description || '') + '</div>' +
                '</div>' +
                '<span style="color:#94a3b8;">&rarr;</span>' +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
                '<span style="font-size:0.75rem; color:#64748b;">' + count + ' comments</span>' +
                renderSentimentBar(sentCounts, count) +
              '</div>' +
              '<div style="display:flex; flex-wrap:wrap; gap:4px;">' +
                optsHtml + moreOpts +
              '</div>' +
            '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
      } else {
        const dim = schema.dimensions.find(d => d.key === state.selectedDimension);
        if (!dim) return;

        let html = '<div style="margin-bottom:24px;">' +
            '<button onclick="selectDimension(null)" style="background:none; border:none; color:#4f46e5; cursor:pointer; font-weight:500; font-size:0.875rem; padding:0; margin-bottom:8px; display:inline-flex; align-items:center; gap:4px;">' +
              '&larr; Back' +
            '</button>' +
            '<h3 style="font-size:1.25rem; font-weight:600;">' + dim.key + '</h3>' +
            '<p style="font-size:0.875rem; color:#64748b;">' + (dim.description || '') + '</p>' +
          '</div>';

        const stats = {};
        data.forEach(item => {
          const val = item.tags ? item.tags[dim.key] : item[dim.key];
          if (!val || EXCLUDED_VALUES.has(val)) return;
          if (!stats[val]) {
            stats[val] = { option: val, count: 0, likes: 0, replies: 0, score: 0, comments: [], sentCounts: {positive:0, neutral:0, negative:0} };
          }
          stats[val].count++;
          stats[val].likes += item.likes || 0;
          stats[val].replies += item.replies || 0;
          stats[val].score += combinedScore(item);
          stats[val].comments.push(item);
          stats[val].sentCounts[normalizeSentiment(item.sentiment)]++;
        });

        const sortedOptions = Object.values(stats).sort((a, b) => b.score - a.score);

        html += '<div style="display:flex; flex-direction:column; gap:12px;">';
        sortedOptions.forEach(opt => {
          const isExpanded = state.expandedOption === opt.option;
          html += '<div style="background:white; border-radius:8px; border:1px solid ' + (isExpanded ? '#c7d2fe' : '#e2e8f0') + '; box-shadow:' + (isExpanded ? '0 0 0 2px rgba(79,70,229,0.1)' : '0 1px 2px rgba(0,0,0,0.05)') + '; overflow:hidden;">' +
              '<div style="padding:16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="toggleOption(\\'' + opt.option.replace(/'/g, "\\'") + '\\')">' +
                '<div style="flex:1;">' +
                  '<div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">' +
                    '<div style="font-weight:500; color:#1e293b;">' + opt.option + '</div>' +
                    renderSentimentBar(opt.sentCounts, opt.count) +
                  '</div>' +
                  '<div style="font-size:0.75rem; color:#64748b; display:flex; gap:16px;">' +
                    '<span>' + opt.count + ' comments</span>' +
                    '<span>' + opt.likes + ' likes</span>' +
                    '<span>' + opt.replies + ' replies</span>' +
                  '</div>' +
                '</div>' +
                '<div style="text-align:right; margin-right:16px;">' +
                  '<div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Score</div>' +
                  '<div style="font-weight:600; color:#4f46e5; font-size:1.125rem;">' + opt.score.toFixed(0) + '</div>' +
                '</div>' +
                '<div style="color:#94a3b8;">' +
                  (isExpanded ? '&#9652;' : '&#9662;') +
                '</div>' +
              '</div>';

          if (isExpanded) {
            const topComments = opt.comments.sort((a, b) => combinedScore(b) - combinedScore(a)).slice(0, 10);
            html += '<div style="border-top:1px solid #e1e7ef; padding:16px; background:#f8fafc; display:flex; flex-direction:column; gap:8px;">';
            topComments.forEach(c => {
              html += '<div style="background:white; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">' +
                  '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">' +
                    '<div style="display:flex; gap:8px; align-items:center;">' +
                      getSentimentBadge(c.sentiment) +
                      (c.persona_name ? '<span style="font-size:0.75rem; color:#64748b;">' + c.persona_name + '</span>' : '') +
                    '</div>' +
                    '<div style="font-size:0.7rem; font-family:monospace; color:#94a3b8;">' +
                      (c.likes || 0) + ' likes &middot; ' + (c.replies || 0) + ' replies' +
                    '</div>' +
                  '</div>' +
                  '<div style="font-size:0.875rem; color:#334155; line-height:1.5;">' + (c.body || '') + '</div>' +
                '</div>';
            });
            if (opt.comments.length > 10) {
              html += '<div style="font-size:0.75rem; color:#64748b; text-align:center; margin-top:4px;">Showing top 10 of ' + opt.comments.length + ' comments</div>';
            }
            html += '</div>';
          }
          html += '</div>';
        });
        html += '</div>';

        container.innerHTML = html;
      }
    }

    window.selectDimension = function(key) {
      state.selectedDimension = key;
      state.expandedOption = null;
      renderDimensions();
    };

    window.toggleOption = function(opt) {
      if (state.expandedOption === opt) {
        state.expandedOption = null;
      } else {
        state.expandedOption = opt;
      }
      renderDimensions();
    };

    function init() {
      initFilters();
      renderComments();
      renderTopicDist();
      renderDimensions();
      updateFormulaPreview();

      document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.dataset.filter;
          const value = btn.dataset.value;
          state[filter] = value;
          state.page = 1;
          document.querySelectorAll('.filter-btn[data-filter="' + filter + '"]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderComments();
        });
      });

      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-dim-filter]');
        if (!btn) return;
        const dimKey = btn.dataset.dimFilter;
        const value = btn.dataset.value;
        state.dimensions[dimKey] = value;
        state.page = 1;
        document.querySelectorAll('[data-dim-filter="' + dimKey + '"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderComments();
      });

      document.querySelectorAll('.filter-btn[data-sort]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sort = btn.dataset.sort;
          if (state.sortBy === sort) {
            state.sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc';
          } else {
            state.sortBy = sort;
            state.sortOrder = 'desc';
          }
          document.querySelectorAll('.filter-btn[data-sort]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          btn.textContent = btn.textContent.replace('↓', '').replace('↑', '') + (state.sortOrder === 'desc' ? ' ↓' : ' ↑');
          renderComments();
        });
      });
    }

    init();
  </script>
</body>
</html>`

  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${report.filename || "comment-analysis-report"}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

type ModelMode = "flash" | "plus" | "flash-thinking" | "plus-thinking"
const MODEL_MODE_OPTIONS: ModelMode[] = ["flash", "plus", "flash-thinking", "plus-thinking"]

function BatchModal({
  sources,
  postContents,
  onPostContentChange,
  onAnalyze,
  onClose,
}: {
  sources: DataSource[]
  postContents: Record<string, string>
  onPostContentChange: (id: string, value: string) => void
  onAnalyze: (name: string, modelInsights: ModelMode) => void
  onClose: () => void
}) {
  const [batchName, setBatchName] = useState(`Batch Analysis (${sources.map(s => s.name).join(", ").slice(0, 40)}${sources.length > 2 ? "..." : ""})`)
  const [modelInsights, setModelInsights] = useState<ModelMode>("plus-thinking")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-serif text-lg font-semibold text-slate-900 dark:text-slate-100">Batch Analysis</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Batch Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={batchName}
              onChange={e => setBatchName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Insights model</label>
            <Select value={modelInsights} onValueChange={(v: ModelMode) => setModelInsights(v)}>
              <SelectTrigger className="mt-1 bg-white dark:bg-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_MODE_OPTIONS.map(mode => (
                  <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Selected Posts — Add post content for better synthesis (optional)
            </p>
            {sources.map(source => (
              <div key={source.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{source.name}</span>
                  <span className="ml-auto text-xs text-slate-400">{source.comment_count || 0} reviews</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Optional: paste the original post content here..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  value={postContents[source.id] || ""}
                  onChange={e => onPostContentChange(source.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => onAnalyze(batchName, modelInsights)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          >
            <Layers className="h-4 w-4" />
            Analyze {sources.length} Posts
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CommentAnalysisPage() {
  const profile = useUserStore(state => state.profile)

  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [report, setReport] = useState<CommentAnalysisReport | null>(null)
  const [isLoadingSources, setIsLoadingSources] = useState(true)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAnalyzingBatch, setIsAnalyzingBatch] = useState(false)
  const [analysisPhase, setAnalysisPhase] = useState<number>(0)
  const [analysisMessage, setAnalysisMessage] = useState<string>("")
  const [showUploader, setShowUploader] = useState(false)

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set())
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchPostContents, setBatchPostContents] = useState<Record<string, string>>({})

  // Load sources on mount
  useEffect(() => {
    if (!profile?.kawo_token) return

    let isMounted = true

    async function loadSources() {
      try {
        setIsLoadingSources(true)
        setError(null)

        const response = await directApiCall<{ sources: DataSource[] }>(
          "content-analysis/data-sources",
          { includeOrgBrandHeaders: false }
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
  }, [profile?.kawo_token])

  // Load report when source changes
  useEffect(() => {
    if (!profile?.kawo_token) return
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
          `content-analysis/content-analysis?source_id=${encodeURIComponent(sourceId)}`,
          { includeOrgBrandHeaders: false }
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
  }, [selectedSourceId, profile?.kawo_token])

  const handleFileProcessed = async (
    comments: ProcessedComment[],
    filename: string,
    name: string,
    postContent: string,
    modelModes: AnalysisModelModes
  ) => {
    setIsAnalyzing(true)
    setIsAnalyzingBatch(false)
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

      const { job_id } = await createAnalysisJob({
        items,
        filename,
        name: name || filename.split('.')[0] || "Uploaded Analysis",
        post_content: postContent || undefined,
        model_schema: modelModes.model_schema,
        model_tagging: modelModes.model_tagging,
        model_tagging_rerun: modelModes.model_tagging_rerun,
        model_persona: modelModes.model_persona,
        model_topic: modelModes.model_topic,
        model_insights: modelModes.model_insights,
      })

      while (true) {
        await new Promise(resolve => setTimeout(resolve, ANALYSIS_POLL_INTERVAL_MS))
        const job = await pollJob(job_id)
        if (job.status === 'processing') {
          const progress = getJobProgress(job)
          if (progress && typeof progress.phase === 'number') {
            setAnalysisPhase(progress.phase)
            if (progress.message) setAnalysisMessage(progress.message)
          }
        } else if (job.status === 'done' && job.results?.source_id) {
          const response = await directApiCall<{ sources: DataSource[] }>("content-analysis/data-sources", { includeOrgBrandHeaders: false })
          const sources = response?.sources ?? []
          setDataSources(sources)
          setSelectedSourceId(job.results.source_id)
          setIsAnalyzing(false)
          return
        } else if (job.status === 'error') {
          throw new Error(job.error || "Analysis failed")
        }
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err : new Error("Analysis failed"))
      setIsAnalyzing(false)
      setShowUploader(true) // Show uploader again on error
    }
  }

  const handleBatchAnalysis = async (batchName: string, modelInsights: ModelMode) => {
    const ids = Array.from(selectedBatchIds)
    setShowBatchModal(false)
    setIsBatchMode(false)
    setSelectedBatchIds(new Set())
    setIsAnalyzing(true)
    setIsAnalyzingBatch(true)
    setAnalysisPhase(0)
    setAnalysisMessage("Starting batch analysis...")

    try {
      const items = ids.map(id => ({
        source_id: id,
        post_content: batchPostContents[id] || undefined,
      }))

      const { job_id } = await createBatchAnalysisJob({
        items,
        name: batchName || "Batch Analysis",
        model_insights: modelInsights,
      })

      while (true) {
        await new Promise(resolve => setTimeout(resolve, ANALYSIS_POLL_INTERVAL_MS))
        const job = await pollJob(job_id)
        if (job.status === 'processing') {
          const progress = getJobProgress(job)
          if (progress && typeof progress.phase === 'number') {
            setAnalysisPhase(progress.phase)
            if (progress.message) setAnalysisMessage(progress.message)
          }
        } else if (job.status === 'done' && job.results?.source_id) {
          const response = await directApiCall<{ sources: DataSource[] }>("content-analysis/data-sources", { includeOrgBrandHeaders: false })
          const sources = response?.sources ?? []
          setDataSources(sources)
          setSelectedSourceId(job.results.source_id)
          setIsAnalyzing(false)
          setBatchPostContents({})
          return
        } else if (job.status === 'error') {
          throw new Error(job.error || "Batch analysis failed")
        }
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err : new Error("Batch analysis failed"))
      setIsAnalyzing(false)
    }
  }

  const totalSentiment = useMemo(() => {
    if (!report?.sentiment_distribution) return 0
    return Object.values(report.sentiment_distribution).reduce((sum, value) => sum + value, 0)
  }, [report?.sentiment_distribution])

  const topicDistribution = useMemo(() => {
    // For batch reports use the aggregated topic_distribution
    if (!report?.tagged_data && report?.topic_distribution) {
      const dist = report.topic_distribution
      const total = Object.values(dist).reduce((s, v) => s + v, 0)
      return Object.entries(dist)
        .filter(([t]) => t && !EXCLUDED_TAG_VALUES.has(t))
        .map(([topic, count]) => ({ topic, count, percent: total ? Math.round((count / total) * 1000) / 10 : 0 }))
        .sort((a, b) => b.count - a.count)
    }
    if (!report?.tagged_data) return []
    const dist: Record<string, number> = {}
    let total = 0
    report.tagged_data.forEach(item => {
      const t = item.tags?.topic || item.topic
      const topicName = t && !EXCLUDED_TAG_VALUES.has(t) ? t : "Uncategorized"
      dist[topicName] = (dist[topicName] || 0) + 1
      total++
    })
    return Object.entries(dist)
      .map(([topic, count]) => ({ topic, count, percent: total ? Math.round((count / total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.count - a.count)
  }, [report?.tagged_data, report?.topic_distribution])

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
            <div className="flex items-center gap-2">
              {isBatchMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setIsBatchMode(false); setSelectedBatchIds(new Set()) }}
                    className="gap-1.5 text-slate-500"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedBatchIds.size < 2}
                    onClick={() => setShowBatchModal(true)}
                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Layers className="h-4 w-4" />
                    Analyze {selectedBatchIds.size > 0 ? `(${selectedBatchIds.size})` : "Selected"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBatchMode(true)}
                  className="gap-1.5"
                >
                  <Layers className="h-4 w-4" />
                  Batch Analysis
                </Button>
              )}
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
            {dataSources.map((source) => {
              const isSelectable = isBatchMode && !source.is_batch
              const isSelected = selectedBatchIds.has(source.id)
              return (
                <div
                  key={source.id}
                  onClick={() => {
                    if (isBatchMode) {
                      if (!isSelectable) return
                      setSelectedBatchIds(prev => {
                        const next = new Set(prev)
                        if (next.has(source.id)) next.delete(source.id)
                        else next.add(source.id)
                        return next
                      })
                    } else {
                      setSelectedSourceId(source.id)
                    }
                  }}
                  className={cn(
                    "group relative flex h-64 flex-col justify-between rounded-xl border bg-white dark:bg-slate-800 p-6 shadow-sm transition-all",
                    isBatchMode
                      ? isSelectable
                        ? isSelected
                          ? "cursor-pointer border-indigo-500 ring-2 ring-indigo-400 shadow-md"
                          : "cursor-pointer border-white/50 dark:border-slate-700/50 hover:-translate-y-1 hover:shadow-md hover:border-indigo-300"
                        : "cursor-not-allowed opacity-50 border-white/50 dark:border-slate-700/50"
                      : "cursor-pointer border-white/50 dark:border-slate-700/50 hover:-translate-y-1 hover:shadow-md"
                  )}
                >
                  {/* Batch mode checkbox */}
                  {isBatchMode && isSelectable && (
                    <div className={cn(
                      "absolute top-3 left-3 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                      isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    )}>
                      {isSelected && <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        source.is_batch
                          ? "bg-violet-50 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400"
                          : "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                      )}>
                        {source.is_batch ? <Layers className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {source.is_batch && (
                          <span className="rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
                            Batch
                          </span>
                        )}
                        {source.updated_at && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                            <Clock className="h-3 w-3" />
                            {formatAnalysisDate(source.updated_at)}
                          </span>
                        )}
                        {!isBatchMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-300 dark:text-slate-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteSource(e, source.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
              )
            })}
          </div>
        </div>

        {/* Batch Modal */}
        {showBatchModal && (
          <BatchModal
            sources={dataSources.filter(s => selectedBatchIds.has(s.id))}
            postContents={batchPostContents}
            onPostContentChange={(id, value) => setBatchPostContents(prev => ({ ...prev, [id]: value }))}
            onAnalyze={handleBatchAnalysis}
            onClose={() => setShowBatchModal(false)}
          />
        )}
      </div>
    )
  }

  // Header for other views
  const renderHeader = () => (
    <header className="border-b border-indigo-100 dark:border-indigo-800 pb-6 mb-8">
      <div className="flex items-center justify-between gap-4">
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
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {isAnalyzing ? "Analyzing Content..." : showUploader ? "New Analysis" : report?.filename || "Analysis Report"}
              </h1>
              {!isAnalyzing && !showUploader && selectedSourceId && dataSources.find(s => s.id === selectedSourceId)?.is_batch && (
                <span className="rounded-full bg-violet-100 dark:bg-violet-900/40 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
                  Batch
                </span>
              )}
            </div>
            {!isAnalyzing && !showUploader && report && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                 <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {report.summary.total_reviews} comments</span>
                 <span>·</span>
                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {report.analysis_date && formatAnalysisDate(report.analysis_date)}</span>
              </p>
            )}
          </div>
        </div>
        {report && !isAnalyzing && !showUploader && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadJSONData(report)}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Download Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadHTMLReport(report)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download HTML
            </Button>
          </div>
        )}
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
          <AnalysisProgress phase={analysisPhase} message={analysisMessage} isBatch={isAnalyzingBatch} />
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

        {!report.is_batch && (
          <section className="grid gap-4 md:grid-cols-4">
            <div className="relative overflow-hidden rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-5">
              <div className="text-[0.7rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Total Comments</div>
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
          </section>
        )}

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
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">Sentiment & Topic Distribution</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Distribution of customer sentiment and topics</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-6">
                <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100 mb-6">Sentiment</h3>
                <div className="space-y-5">
                  {Object.entries(report.sentiment_distribution).map(([label, count]) => {
                    const percent = totalSentiment ? Math.round((count / totalSentiment) * 1000) / 10 : 0
                    const color = sentimentColor(label)

                    return (
                      <div key={label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{sentimentLabel(label)}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{count}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">({percent}%)</span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${percent}%`, background: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-white/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm p-6">
                <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100 mb-6">Topics</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {topicDistribution.length === 0 ? (
                    <p className="text-sm text-slate-500">No topics available</p>
                  ) : (
                    topicDistribution.map(({ topic, count, percent }, idx) => {
                      const topicColors = ["#6366f1","#8b5cf6","#a78bfa","#818cf8","#7c3aed","#4f46e5","#6d28d9","#7e22ce"]
                      const color = topicColors[idx % topicColors.length]
                      return (
                        <div key={topic} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[160px]" title={topic}>{topic}</span>
                            <div className="flex items-baseline gap-1.5 shrink-0">
                              <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{count}</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500">({percent}%)</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${percent}%`, background: color }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
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

        {/* 5. All Comments */}
        {!!report.tagged_data?.length && (
          <CommentList taggedData={report.tagged_data} personas={report.personas ?? []} schemaSnapshot={report.schema_snapshot} />
        )}

        <footer className="border-t border-indigo-100 dark:border-indigo-800 py-10 text-center text-xs text-slate-400 dark:text-slate-500">
          <div className="font-serif text-lg text-indigo-600 dark:text-indigo-400">Generated by AI</div>
          {report.analysis_date && <p className="mt-2">{formatAnalysisDate(report.analysis_date)}</p>}
        </footer>
      </div>
    </div>
  )
}
