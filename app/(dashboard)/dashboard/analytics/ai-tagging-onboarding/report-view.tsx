"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, ArrowRight, Check, CircleHelp, FileSearch, ListChecks, Search, ShieldCheck, Sparkles, Tags } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { AiTaggingReport } from "@/lib/api/ai-tagging-onboarding"

function percent(value?: number | null) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "—"
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function readinessExplanation(value: string) {
  if (value === "ready_for_ai_tagging") return "The evidence supports using AI across the eligible categories with normal monitoring."
  if (value === "ready_for_pilot_with_changes") return "A pilot is reasonable after making the changes called out below."
  if (value === "taxonomy_changes_required_first") return "Clarify or restructure the current tags before testing AI tagging."
  if (value === "insufficient_evidence") return "There is not enough reliable evidence to make a rollout decision yet."
  return "Use the evidence and rollout lanes below to plan the next step."
}

function Metric({ label, value, note, meaning }: { label: string; value: string; note: string; meaning: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      <p className="mt-3 border-t pt-3 text-xs leading-5 text-foreground/75">{meaning}</p>
    </div>
  )
}

function TagList({ values, tone = "neutral" }: { values: string[]; tone?: "neutral" | "good" | "warn" }) {
  if (!values.length) return <span className="text-xs text-muted-foreground">None</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs",
            tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
            tone === "warn" && "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
            tone === "neutral" && "bg-muted/50",
          )}
        >
          {value}
        </span>
      ))}
    </div>
  )
}

export function AiTaggingReportView({ report }: { report: AiTaggingReport }) {
  const [postQuery, setPostQuery] = useState("")
  const [onlyDifferences, setOnlyDifferences] = useState(true)
  const validation = report.ai_tagging_validation
  const summary = report.executive_summary
  const filteredPosts = useMemo(() => {
    const query = postQuery.trim().toLowerCase()
    return (report.audit?.post_analysis || []).filter((post) => {
      if (onlyDifferences && !post.differences?.length && !post.tagging_error) return false
      if (!query) return true
      return JSON.stringify(post).toLowerCase().includes(query)
    })
  }, [onlyDifferences, postQuery, report.audit?.post_analysis])

  return (
    <div id="ai-tagging-report" className="space-y-7">
      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{report.status}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(report.generated_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-5 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">The short answer</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Can AI help tag this brand&apos;s posts?</h2>
              <div className="mt-3 space-y-3 text-base leading-7 text-foreground/90 sm:text-lg sm:leading-8">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h3 className="text-xl font-semibold leading-7">{children}</h3>,
                    h2: ({ children }) => <h3 className="text-lg font-semibold leading-7">{children}</h3>,
                    h3: ({ children }) => <h3 className="font-semibold leading-7">{children}</h3>,
                    p: ({ children }) => <p>{children}</p>,
                    ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  }}
                >
                  {summary.conclusion}
                </ReactMarkdown>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Readiness decision</p>
                <p className="mt-0.5 font-medium">{statusLabel(summary.readiness_status)}</p>
                <p className="mt-1 text-sm text-sky-900/75 dark:text-sky-100/75">{readinessExplanation(summary.readiness_status)}</p>
              </div>
            </div>
          </div>
          <div className="border-t bg-slate-950 p-6 text-slate-100 lg:border-l lg:border-t-0 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Recommended next move</p>
            <p className="mt-4 text-base leading-7 text-slate-200">{summary.next_step}</p>
            <div className="mt-6 flex items-center gap-2 text-sm text-sky-300">
              <ArrowRight className="h-4 w-4" />
              {report.recommended_rollout.pilot_categories.length} categories ready for a pilot
            </div>
          </div>
        </div>
      </section>

      {report.data_quality.cold_start && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {report.data_quality.cold_start_message}
        </div>
      )}

      <section className="rounded-2xl border bg-background p-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Evidence snapshot</p>
          <h2 className="mt-2 text-xl font-semibold">Four numbers behind the decision</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">These numbers describe the available data and how closely AI reproduced the tags already on your posts. Existing tags are a comparison point, not guaranteed ground truth.</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Posts with existing tags" value={percent(report.taxonomy_snapshot.existing_tag_coverage)} note={`${report.taxonomy_snapshot.existing_tagged_post_count} posts in the window`} meaning="Higher coverage gives the comparison a stronger foundation." />
          <Metric label="Tag usage AI can infer" value={percent(report.ai_inference_opportunity.automatable_usage_share)} note="Share of current category assignments" meaning="The portion of today's tagging work AI may be able to assist with." />
          <Metric label="Overall AI agreement" value={percent(validation.f1_against_existing_tags)} note={`${validation.valid_sample_posts} valid sampled posts`} meaning="A balanced measure of whether AI found the same tag values as your team." />
          <Metric label="Posts matched exactly" value={percent(validation.post_exact_match_rate)} note="Across content-inferable categories" meaning="The share of sampled posts where every comparable AI tag matched." />
        </div>
      </section>

      <Tabs defaultValue="overview" className="space-y-5">
        <div data-report-tabs className="rounded-2xl border bg-muted/25 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
            <div><p className="text-sm font-semibold">Explore the report</p><p className="mt-0.5 text-xs text-muted-foreground">Choose a view to inspect the evidence behind the decision.</p></div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-300"><CircleHelp className="h-3.5 w-3.5" /> Select a tab below</p>
          </div>
          <div className="overflow-x-auto pb-1">
            <TabsList aria-label="Report sections" className="grid h-auto w-full min-w-[720px] grid-cols-4 gap-2 overflow-visible rounded-xl border bg-background p-2 shadow-sm">
              <TabsTrigger id="report-tab-overview" aria-controls="report-panel-overview" data-report-tab="overview" value="overview" className="h-auto cursor-pointer justify-start gap-3 border border-transparent bg-transparent px-4 py-3 text-left data-[state=active]:border-sky-500 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                <ListChecks className="h-5 w-5 shrink-0" /><span><span className="block font-semibold">Decision brief</span><span className="mt-0.5 block text-xs font-normal opacity-75">Actions and rollout</span></span>
              </TabsTrigger>
              <TabsTrigger id="report-tab-categories" aria-controls="report-panel-categories" data-report-tab="categories" value="categories" className="h-auto cursor-pointer justify-start gap-3 border border-transparent bg-transparent px-4 py-3 text-left data-[state=active]:border-sky-500 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                <Tags className="h-5 w-5 shrink-0" /><span><span className="block font-semibold">Category audit</span><span className="mt-0.5 block text-xs font-normal opacity-75">Results by tag group</span></span>
              </TabsTrigger>
              <TabsTrigger id="report-tab-posts" aria-controls="report-panel-posts" data-report-tab="posts" value="posts" className="h-auto cursor-pointer justify-start gap-3 border border-transparent bg-transparent px-4 py-3 text-left data-[state=active]:border-sky-500 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                <FileSearch className="h-5 w-5 shrink-0" /><span><span className="block font-semibold">Post explorer</span><span className="mt-0.5 block text-xs font-normal opacity-75">Compare post by post</span></span>
              </TabsTrigger>
              <TabsTrigger id="report-tab-method" aria-controls="report-panel-method" data-report-tab="method" value="method" className="h-auto cursor-pointer justify-start gap-3 border border-transparent bg-transparent px-4 py-3 text-left data-[state=active]:border-sky-500 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                <CircleHelp className="h-5 w-5 shrink-0" /><span><span className="block font-semibold">Method & caveat</span><span className="mt-0.5 block text-xs font-normal opacity-75">Scope and limitations</span></span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent id="report-panel-overview" aria-labelledby="report-tab-overview" value="overview" forceMount data-report-panel="overview" data-report-section="Decision brief" className="space-y-5">
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sm leading-6 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"><strong>Start here.</strong> Use the rollout lanes to decide where AI can be tested, where a person should review its work, and which categories should stay outside the pilot.</div>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border bg-background p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-600" />
                <h3 className="text-lg font-semibold">Key insights</h3>
              </div>
              <div className="mt-5 space-y-4">
                {summary.key_insights.map((insight, index) => (
                  <article key={`${insight.category}-${index}`} className="border-l pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {insight.category && <Badge variant="secondary">{insight.category}</Badge>}
                      <span className="text-xs text-muted-foreground">{statusLabel(insight.type)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6">{insight.insight}</p>
                    <p className="mt-2 text-sm font-medium text-sky-700 dark:text-sky-300">{insight.action}</p>
                  </article>
                ))}
                {!summary.key_insights.length && <p className="text-sm text-muted-foreground">No evidence-backed insights were produced.</p>}
              </div>
            </section>
            <section className="rounded-2xl border bg-background p-6">
              <h3 className="text-lg font-semibold">Rollout lanes</h3>
              <div className="mt-5 space-y-5">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Pilot</p><p className="mb-2 mt-1 text-xs text-muted-foreground">Test AI on these categories first.</p><TagList values={report.recommended_rollout.pilot_categories} tone="good" /></div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Human review</p><p className="mb-2 mt-1 text-xs text-muted-foreground">Let AI suggest, then have a person confirm.</p><TagList values={report.recommended_rollout.human_review_categories} tone="warn" /></div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keep manual</p><p className="mb-2 mt-1 text-xs text-muted-foreground">Business metadata cannot be inferred reliably from post content.</p><TagList values={report.recommended_rollout.metadata_categories} /></div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needs more evidence</p><p className="mb-2 mt-1 text-xs text-muted-foreground">Collect or review more examples before deciding.</p><TagList values={report.recommended_rollout.unvalidated_categories} /></div>
              </div>
            </section>
          </div>
          {!!summary.suggestions.length && (
            <section className="rounded-2xl border bg-background p-6">
              <h3 className="text-lg font-semibold">Potential additions</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {summary.suggestions.map((suggestion) => <div key={suggestion} className="rounded-xl bg-muted/50 p-4 text-sm leading-6">{suggestion}</div>)}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent id="report-panel-categories" aria-labelledby="report-tab-categories" value="categories" forceMount data-report-panel="categories" data-report-section="Category audit" className="space-y-4">
          <div className="rounded-xl border bg-background p-4"><h3 className="font-semibold">How to read the category audit</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Each card shows how often a category appears and how closely AI reproduced existing values. Low agreement can point to unclear definitions, content that is hard to infer, or inconsistent historical tagging.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><p className="rounded-lg bg-muted/50 p-3 text-xs leading-5"><strong className="block text-foreground">Precision</strong>When AI applied a tag, how often an existing tag agreed.</p><p className="rounded-lg bg-muted/50 p-3 text-xs leading-5"><strong className="block text-foreground">Recall</strong>How many existing tags AI successfully reproduced.</p><p className="rounded-lg bg-muted/50 p-3 text-xs leading-5"><strong className="block text-foreground">F1 agreement</strong>A balance of precision and recall for quick comparison.</p></div></div>
          {report.category_details.map((category) => (
            <section key={category.category} className="rounded-2xl border bg-background p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{category.category}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{category.insight?.summary || "No synthesized category note."}</p>
                </div>
                <Badge variant="outline">Source: {statusLabel(category.inference_source.inference_source)}</Badge>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-4">
                <div><p className="text-xs text-muted-foreground">Observed posts</p><p className="mt-1 text-xl font-semibold">{category.usage.post_count}</p></div>
                <div><p className="text-xs text-muted-foreground">Precision</p><p className="mt-1 text-xl font-semibold">{percent(category.validation?.precision_against_existing_tags)}</p></div>
                <div><p className="text-xs text-muted-foreground">Recall</p><p className="mt-1 text-xl font-semibold">{percent(category.validation?.recall_against_existing_tags)}</p></div>
                <div><p className="text-xs text-muted-foreground">F1 agreement</p><p className="mt-1 text-xl font-semibold">{percent(category.validation?.f1_against_existing_tags)}</p></div>
              </div>
              {!!category.usage.values.length && <div className="mt-5"><TagList values={category.usage.values.slice(0, 12).map((value) => `${value.value} · ${value.post_count}`)} /></div>}
              {!!category.insight?.issues?.length && <div className="mt-4 space-y-1 text-sm text-amber-800 dark:text-amber-200">{category.insight.issues.map((issue) => <p key={issue}>• {issue}</p>)}</div>}
            </section>
          ))}
        </TabsContent>

        <TabsContent id="report-panel-posts" aria-labelledby="report-tab-posts" value="posts" forceMount data-report-panel="posts" data-report-section="Post explorer" className="space-y-4">
          <div className="rounded-xl border bg-background p-4"><h3 className="font-semibold">Review the disagreements</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Compare the tags already saved on a post with the AI suggestion. A difference is something to investigate—not automatic proof that either side is wrong.</p></div>
          <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={postQuery} onChange={(event) => setPostQuery(event.target.value)} placeholder="Search post, category, or tag" className="pl-9" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyDifferences} onChange={(event) => setOnlyDifferences(event.target.checked)} className="h-4 w-4 rounded" />
              Differences only
            </label>
            <span className="text-xs text-muted-foreground">{filteredPosts.length} posts</span>
          </div>
          {filteredPosts.map((post) => (
            <article key={post.post_id} className="rounded-2xl border bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-mono text-xs text-muted-foreground">{post.post_id}</p><p className="mt-1 text-sm">{[post.network, post.publish_month].filter(Boolean).join(" · ")}</p></div>
                {post.tagging_error ? <Badge variant="destructive">Tagging failed</Badge> : post.differences.length ? <Badge variant="secondary">{post.differences.length} category differences</Badge> : <Badge className="bg-emerald-600"><Check className="mr-1 h-3 w-3" /> Exact</Badge>}
              </div>
              {(post.input_preview?.text || post.input_preview?.video_description) && <p className="mt-4 line-clamp-3 whitespace-pre-wrap rounded-xl bg-muted/45 p-3 text-sm leading-6">{post.input_preview.text || post.input_preview.video_description}</p>}
              <div className="mt-4 space-y-3">
                {post.differences.map((difference) => (
                  <div key={difference.category} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[160px_1fr_1fr]">
                    <p className="font-medium">{difference.category}</p>
                    <div><p className="mb-1.5 text-xs text-muted-foreground">Existing</p><TagList values={difference.existing_values} /></div>
                    <div><p className="mb-1.5 text-xs text-muted-foreground">AI</p><TagList values={difference.ai_values} tone="warn" /></div>
                  </div>
                ))}
              </div>
            </article>
          ))}
          {!filteredPosts.length && <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No posts match these filters.</div>}
        </TabsContent>

        <TabsContent id="report-panel-method" aria-labelledby="report-tab-method" value="method" forceMount data-report-panel="method" data-report-section="Method & caveat" className="space-y-5">
          <section className="rounded-2xl border bg-background p-6">
            <h3 className="text-lg font-semibold">What these numbers mean</h3>
            <p className="mt-2 text-sm leading-6 text-foreground/80">The analysis sampled recent posts, asked AI to infer content-based tags, then compared those suggestions with existing tags. It supports a pilot decision; it does not measure business impact or prove that historical tags are correct.</p>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">{validation.caveat}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Analysis window</p><p className="mt-1 font-medium">{report.analysis_window.days} days</p></div>
              <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Posts fetched</p><p className="mt-1 font-medium">{report.data_quality.total_posts}</p></div>
              <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Vision sample</p><p className="mt-1 font-medium">{report.data_quality.vision_sample_posts}</p></div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
