import { directApiCall } from "./client"

export type AiTaggingPrompts = {
  inference_source: string
  tagging: string
  review: string
  synthesis: string
}

export type AiTaggingPreferences = {
  days: number
  max_vision_posts: number
  max_images: number
  model: string
  tagging_concurrency: number
  review_concurrency: number
  thinking_budget: number
  llm_timeout: number
  prompts: AiTaggingPrompts
  updated_at?: string
}

export type AiTaggingReportSummary = {
  id: string
  name: string
  brand_id: string
  brand_name?: string
  status: "processing" | "done" | "error"
  job_id?: string
  updated_at?: string
  total_posts?: number
  sample_posts?: number
  readiness_status?: string
  error?: string
}

export type AiTaggingJobStatus = {
  job_id: string
  status: "processing" | "done" | "error"
  results?: {
    phase?: number | string
    total_phases?: number
    message?: string
    report_id?: string
  }
  error?: string
}

export type AiTaggingReport = {
  schema_version: string
  status: "complete" | "partial"
  generated_at: string
  brand: { id: string; name?: string; categories?: string[] }
  analysis_window: { start: string; end: string; days: number }
  configuration: {
    model: string
    max_vision_posts: number
    max_images_per_post: number
    tagging_concurrency: number
    review_concurrency: number
    thinking_budget: number
    llm_timeout_seconds: number
    prompts?: AiTaggingPrompts
  }
  data_quality: {
    total_posts: number
    vision_sample_posts: number
    vision_is_full_window: boolean
    tagging_failures: number
    thinking_review_failures: number
    cold_start: boolean
    cold_start_message?: string
  }
  executive_summary: {
    readiness_status: string
    conclusion: string
    evidence: Record<string, number | string | null>
    key_insights: { type: string; category?: string; insight: string; action: string }[]
    suggestions: string[]
    next_step: string
  }
  taxonomy_snapshot: {
    category_count: number
    value_count: number
    existing_tagged_post_count: number
    existing_tag_coverage: number
    missing_category_description_count: number
    missing_value_description_count: number
    unused_value_count_in_window: number
  }
  tag_description_guidance?: { status: string; summary: string }
  ai_inference_opportunity: {
    source_category_counts: Record<string, number>
    content_inferable_category_count: number
    total_category_count: number
    content_inferable_category_share: number | null
    automatable_usage_share: number | null
  }
  ai_tagging_validation: {
    status: string
    sample_post_count: number
    valid_sample_posts: number
    tagging_failure_count: number
    precision_against_existing_tags: number | null
    recall_against_existing_tags: number | null
    f1_against_existing_tags: number | null
    post_exact_match_rate: number | null
    caveat: string
    by_category: Array<{
      category: string
      existing_value_assignments: number
      ai_value_assignments: number
      matched_value_assignments: number
      precision_against_existing_tags: number | null
      recall_against_existing_tags: number | null
      f1_against_existing_tags: number | null
      post_exact_match_rate: number | null
      reviewed_disagreement_outcomes: Record<string, number>
    }>
  }
  recommended_rollout: {
    pilot_categories: string[]
    unvalidated_categories: string[]
    metadata_categories: string[]
    human_review_categories: string[]
  }
  category_details: Array<{
    category: string
    usage: { post_count: number; share: number; values: { value: string; post_count: number }[] }
    inference_source: { inference_source: string; confidence?: number; reasons?: string[]; analysis_status?: string }
    validation?: AiTaggingReport["ai_tagging_validation"]["by_category"][number]
    insight?: { summary?: string; issues?: string[] }
  }>
  audit: {
    post_analysis: Array<{
      post_id: string
      network?: string
      publish_month?: string
      input_preview?: { text?: string; video_description?: string; image_urls?: string[] }
      existing_tags: Record<string, string[]>
      ai_tags: Record<string, string[]>
      differences: Array<{
        category: string
        existing_values: string[]
        ai_values: string[]
        ai_only: string[]
        existing_only: string[]
      }>
      thinking_review?: { assessments?: Array<Record<string, string>> }
      tagging_error?: string
    }>
  }
}

export function getAiTaggingPreferences(): Promise<AiTaggingPreferences> {
  return directApiCall("ai-tagging-onboarding/preferences", { includeOrgBrandHeaders: false })
}

export function updateAiTaggingPreferences(
  payload: Partial<Omit<AiTaggingPreferences, "updated_at">>,
): Promise<AiTaggingPreferences> {
  return directApiCall("ai-tagging-onboarding/preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
    includeOrgBrandHeaders: false,
  })
}

export function createAiTaggingJob(productionToken: string, productionBrandId: string, payload: {
  name?: string
  end_date?: string
} & AiTaggingPreferences): Promise<{ job_id: string; report_id: string }> {
  if (!productionToken.trim() || !productionBrandId.trim()) {
    throw new Error("Production KAWO token and Brand ID are required for this analysis.")
  }
  return directApiCall("ai-tagging-onboarding/jobs", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      kawo_token: productionToken.trim(),
      brand_id: productionBrandId.trim(),
    }),
    includeOrgBrandHeaders: false,
  })
}

export function pollAiTaggingJob(jobId: string): Promise<AiTaggingJobStatus> {
  return directApiCall(`ai-tagging-onboarding/jobs/${encodeURIComponent(jobId)}`, {
    includeOrgBrandHeaders: false,
  })
}

export function listAiTaggingReports(): Promise<{ reports: AiTaggingReportSummary[] }> {
  return directApiCall("ai-tagging-onboarding/reports", { includeOrgBrandHeaders: false })
}

export function getAiTaggingReport(reportId: string): Promise<AiTaggingReport> {
  return directApiCall(`ai-tagging-onboarding/reports/${encodeURIComponent(reportId)}`, {
    includeOrgBrandHeaders: false,
    timeoutMs: 60_000,
  })
}

export async function deleteAiTaggingReport(reportId: string): Promise<void> {
  await directApiCall(`ai-tagging-onboarding/reports/${encodeURIComponent(reportId)}`, {
    method: "DELETE",
    includeOrgBrandHeaders: false,
  })
}

export function retryFailedAiTaggingReport(reportId: string, productionToken: string): Promise<{ job_id: string; report_id: string }> {
  if (!productionToken.trim()) throw new Error("Production KAWO token is required to retry this report.")
  return directApiCall(`ai-tagging-onboarding/reports/${encodeURIComponent(reportId)}/retry`, {
    method: "POST",
    body: JSON.stringify({ kawo_token: productionToken.trim() }),
    includeOrgBrandHeaders: false,
  })
}

export function rerunAiTaggingSynthesis(reportId: string, synthesisPrompt: string): Promise<{ job_id: string; report_id: string }> {
  if (!synthesisPrompt.trim()) throw new Error("A synthesis prompt is required to rerun synthesis.")
  return directApiCall(`ai-tagging-onboarding/reports/${encodeURIComponent(reportId)}/rerun-synthesis`, {
    method: "POST",
    body: JSON.stringify({ synthesis_prompt: synthesisPrompt.trim() }),
    includeOrgBrandHeaders: false,
  })
}
