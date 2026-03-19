
"use client"

import { useEffect, useMemo, useState } from "react"
import { directApiCall } from "@/lib/api/client"
import { ErrorBanner } from "@/components/ui/error-banner"
import { LoadingState } from "@/components/ui/loading"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, FileText, Calendar, MessageSquare, BarChart3, Clock, Trash2, Download } from "lucide-react"
import { FileUploader } from "./file-uploader"
import { AnalysisProgress } from "./analysis-progress"
import { TopicAnalysis } from "./topic-analysis"
import { DimensionAnalysis } from "./dimension-analysis"
import { CommentList } from "./comment-list"
import { analyzeContentStream, type AnalysisPhase } from "@/lib/api/content-analysis"
import { sentimentLabel, sentimentColor, sentimentBadgeClass } from "@/lib/utils/sentiment"
import type { ProcessedComment } from "@/lib/utils/file-processor"
import { cn } from "@/lib/utils"
import type { AnalysisModelModes } from "./file-uploader"

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

function downloadHTMLReport(report: CommentAnalysisReport) {
  const taggedDataJson = JSON.stringify(report.tagged_data || [])
  const personasJson = JSON.stringify(report.personas || [])
  const totalSentiment = report.sentiment_distribution
    ? Object.values(report.sentiment_distribution).reduce((sum, value) => sum + value, 0)
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
    .golden-sample { background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
    .golden-header { padding: 16px 20px; display: flex; align-items: center; gap: 12px; cursor: pointer; }
    .golden-body { padding: 0 20px 20px; font-size: 0.875rem; color: #475569; }
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
        ${report.summary.avg_rating && report.summary.avg_rating > 0 ? `
        <div class="stat-card">
          <div class="stat-label">Avg Rating</div>
          <div class="stat-value">${report.summary.avg_rating}<span style="font-size: 0.875rem; color: #94a3b8;">/5</span></div>
          <div class="stat-accent" style="background: #fbbf24;"></div>
        </div>
        ` : ''}
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

    ${report.sentiment_distribution ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">02</span>
        <div>
          <h2>Sentiment Analysis</h2>
          <p class="subtitle">Distribution of customer sentiment</p>
        </div>
      </div>
      <div class="card">
        ${Object.entries(report.sentiment_distribution).map(([label, count]) => {
          const percent = totalSentiment ? Math.round((count / totalSentiment) * 1000) / 10 : 0
          const colors: Record<string, string> = { positive: '#22c55e', neutral: '#94a3b8', negative: '#ef4444' }
          return `
          <div class="sentiment-bar">
            <span class="sentiment-label">${label}</span>
            <div class="sentiment-bar-bg">
              <div class="sentiment-bar-fill" style="width: ${percent}%; background: ${colors[label] || '#94a3b8'};"></div>
            </div>
            <span class="sentiment-count">${count} (${percent}%)</span>
          </div>
        `}).join('')}
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

    ${report.golden_samples && report.golden_samples.length ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">05</span>
        <div>
          <h2>Golden Samples</h2>
          <p class="subtitle">Deep dive into high-information comments</p>
        </div>
      </div>
      ${report.golden_samples.map((sample) => {
        const badgeColors: Record<string, string> = { positive: '#dcfce7 #166534', neutral: '#f1f5f9 #475569', negative: '#ffe4e6 #e11d48' }
        const [bg, text] = (badgeColors[sample.sentiment] || badgeColors.neutral).split(' ')
        return `
        <div class="golden-sample">
          <div class="golden-header">
            <span class="sentiment-badge" style="background: ${bg}; color: ${text};">${sample.sentiment}</span>
            ${sample.persona_name ? `<span style="font-size: 0.75rem; color: #94a3b8;">${sample.persona_name}</span>` : ''}
            ${sample.info_score !== undefined ? `<span class="info-score">${sample.info_score}/10</span>` : ''}
          </div>
          <div class="golden-body">
            <p style="margin-bottom: 12px;">${sample.body}</p>
            ${sample.reason ? `<p style="color: #4f46e5; font-style: italic;">${sample.reason}</p>` : ''}
            ${Object.keys(sample.tags).length ? `<div style="margin-top: 12px;">${Object.entries(sample.tags).filter(([, v]) => v && !EXCLUDED_TAG_VALUES.has(v)).map(([k, v]) => `<span class="tag" style="background: #e0f2fe; color: #0369a1; border-color: #bae6fd;">${k}: ${v}</span>`).join('')}</div>` : ''}
          </div>
        </div>
      `}).join('')}
    </div>
    ` : ''}

    ${report.tagged_data && report.tagged_data.length && report.sentiment_distribution ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">04</span>
        <div>
          <h2>Topic Analysis</h2>
          <p class="subtitle">Topic clusters with sentiment breakdown</p>
        </div>
      </div>
      <div id="topic-list"></div>
    </div>
    ` : ''}

    ${report.tagged_data && report.tagged_data.length ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">06</span>
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
        <div class="filter-row" id="topic-filters">
          <span class="filter-label">Topic</span>
          <button class="filter-btn active" data-filter="topic" data-value="all">All</button>
        </div>
        <div class="filter-row">
          <span class="filter-label">Sort by</span>
          <button class="filter-btn active" data-sort="info_score" data-order="desc">Score ↓</button>
          <button class="filter-btn" data-sort="likes" data-order="desc">Likes ↓</button>
          <button class="filter-btn" data-sort="replies" data-order="desc">Replies ↓</button>
        </div>
      </div>

      <p class="results-count" id="results-count"></p>
      <div class="card" style="padding: 0; overflow: hidden;">
        <table class="comments-table">
          <thead>
            <tr>
              <th data-sort="sentiment">Sentiment <span class="sort-icon">↕</span></th>
              <th style="width: 40%;">Comment</th>
              <th data-sort="persona_name">Persona <span class="sort-icon">↕</span></th>
              <th data-sort="topic">Topic <span class="sort-icon">↕</span></th>
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
    const EXCLUDED_VALUES = new Set(["Unknown", "unknown", "不明", "未提及", "nan", "None"]);
    const data = ${taggedDataJson};
    const personas = ${personasJson};
    const PAGE_SIZE = 50;

    let state = {
      sentiment: 'all',
      persona: 'all',
      topic: 'all',
      sortBy: 'info_score',
      sortOrder: 'desc',
      page: 1
    };

    function getSentimentClass(sent) {
      if (sent === 'positive') return 'sentiment-pos';
      if (sent === 'negative') return 'sentiment-neg';
      return 'sentiment-neu';
    }

    function getSentimentBadge(sent) {
      const colors = { positive: '#dcfce7', neutral: '#f1f5f9', negative: '#ffe4e6' };
      const textColors = { positive: '#166534', neutral: '#475569', negative: '#e11d48' };
      const bg = colors[sent] || colors.neutral;
      const tc = textColors[sent] || textColors.neutral;
      return '<span class="sentiment-badge" style="background:' + bg + ';color:' + tc + ';">' + (sent || 'unknown') + '</span>';
    }

    function getUniqueValues(field) {
      const vals = new Set();
      data.forEach(d => { if (d[field] && !EXCLUDED_VALUES.has(d[field])) vals.add(d[field]); });
      return Array.from(vals).sort();
    }

    function initFilters() {
      const personas = getUniqueValues('persona_name');
      const topics = getUniqueValues('topic');
      const pfRow = document.getElementById('persona-filters');
      const tfRow = document.getElementById('topic-filters');
      if (pfRow && personas.length) {
        personas.forEach(p => {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.dataset.filter = 'persona';
          btn.dataset.value = p;
          btn.textContent = p;
          pfRow.appendChild(btn);
        });
      }
      if (tfRow && topics.length) {
        topics.forEach(t => {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.dataset.filter = 'topic';
          btn.dataset.value = t;
          btn.textContent = t;
          tfRow.appendChild(btn);
        });
      }
    }

    function getFiltered() {
      return data.filter(d => {
        if (state.sentiment !== 'all' && (d.sentiment || '').toLowerCase() !== state.sentiment) return false;
        if (state.persona !== 'all' && d.persona_name !== state.persona) return false;
        if (state.topic !== 'all' && d.topic !== state.topic) return false;
        return true;
      }).sort((a, b) => {
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
        return '<tr>' +
          '<td>' + getSentimentBadge(item.sentiment) + '</td>' +
          '<td style="max-width:300px;"><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + (item.body || '') + '</span></td>' +
          '<td>' + (item.persona_name || '-') + '</td>' +
          '<td>' + (item.topic || '-') + '</td>' +
          '<td style="text-align:right;font-family:monospace;">' + (item.info_score !== undefined ? item.info_score + '/10' : '-') + '</td>' +
          '</tr>';
      }).join('');

      const pag = document.getElementById('pagination');
      if (!pag) return;
      pag.innerHTML = '<button class="page-btn" onclick="prevPage()" ' + (state.page <= 1 ? 'disabled' : '') + '>← Prev</button>' +
        '<span style="font-size:0.875rem;color:#64748b;">Page ' + state.page + ' of ' + totalPages + '</span>' +
        '<button class="page-btn" onclick="nextPage()" ' + (state.page >= totalPages ? 'disabled' : '') + '>Next →</button>';
    }

    function prevPage() { state.page--; renderComments(); }
    function nextPage() { state.page++; renderComments(); }

    function renderTopics() {
      const stats = {};
      data.forEach(item => {
        const topic = item.topic || 'Uncategorized';
        if (!stats[topic]) stats[topic] = { count: 0, likes: 0, replies: 0, comments: [], sentiment: {} };
        stats[topic].count++;
        stats[topic].likes += item.likes || 0;
        stats[topic].replies += item.replies || 0;
        stats[topic].comments.push(item);
        const s = item.sentiment || 'neutral';
        stats[topic].sentiment[s] = (stats[topic].sentiment[s] || 0) + 1;
      });

      const sorted = Object.entries(stats).map(([topic, d]) => ({ topic, ...d, score: d.count + d.likes * 0.3 + d.replies * 0.5 }))
        .sort((a, b) => b.score - a.score).slice(0, 20);

      const container = document.getElementById('topic-list');
      if (!container) return;
      container.innerHTML = sorted.map(t => {
        const colors = { positive: '#22c55e', neutral: '#94a3b8', negative: '#ef4444' };
        const bars = Object.entries(t.sentiment).map(([s, c]) =>
          '<div class="topic-bar-segment" style="width:' + ((c / t.count) * 100) + '%;background:' + (colors[s] || '#94a3b8') + ';"></div>'
        ).join('');
        const topComments = t.comments.slice(0, 3).map(c =>
          '<div class="topic-comment">' + getSentimentBadge(c.sentiment) + ' ' + (c.body || '').substring(0, 150) + '</div>'
        ).join('');
        return '<div class="topic-card" onclick="toggleTopic(this)">' +
          '<div class="topic-header">' +
          '<div><div class="topic-name">' + t.topic + '</div><div class="topic-stats">' + t.count + ' comments · ' + t.likes + ' likes · ' + t.replies + ' replies</div></div>' +
          '<div style="text-align:right;"><div style="font-size:0.625rem;color:#94a3b8;text-transform:uppercase;">Score</div><div style="font-family:monospace;font-size:1.25rem;color:#4f46e5;">' + Math.round(t.score) + '</div></div>' +
          '</div><div class="topic-bar">' + bars + '</div>' +
          '<div class="topic-expand">' + topComments + '</div></div>';
      }).join('');
    }

    function toggleTopic(el) {
      const expand = el.querySelector('.topic-expand');
      expand.classList.toggle('show');
    }

    function init() {
      initFilters();
      renderComments();
      renderTopics();

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

  const handleFileProcessed = async (
    comments: ProcessedComment[],
    filename: string,
    name: string,
    postContent: string,
    modelModes: AnalysisModelModes
  ) => {
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
        model_schema: modelModes.model_schema,
        model_tagging: modelModes.model_tagging,
        model_tagging_rerun: modelModes.model_tagging_rerun,
        model_persona: modelModes.model_persona,
        model_topic: modelModes.model_topic,
        model_insights: modelModes.model_insights,
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
        {report && !isAnalyzing && !showUploader && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadHTMLReport(report)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download HTML
          </Button>
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
