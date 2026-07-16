
import { getKawoConfig } from './client'

export type AnalysisPhase = {
  phase: number | string
  message?: string
  source_id?: string
  job_id?: string
}

export type ContentAnalysisRequest = {
  model_schema?: "flash" | "plus" | "flash-thinking" | "plus-thinking"
  model_tagging?: "flash" | "plus" | "flash-thinking" | "plus-thinking"
  model_tagging_rerun?: "flash" | "plus" | "flash-thinking" | "plus-thinking"
  model_persona?: "flash" | "plus" | "flash-thinking" | "plus-thinking"
  model_topic?: "flash" | "plus" | "flash-thinking" | "plus-thinking"
  model_insights?: "flash" | "plus" | "flash-thinking" | "plus-thinking"
  items: {
    type: string
    content: string
    transcript?: string
    imageDescription?: string
    likes?: number
    replies?: number
  }[]
  filename?: string
  name?: string
  post_content?: string
  source_id?: string
}

export type BatchAnalysisRequest = {
  items: {
    source_id: string
    post_content?: string
  }[]
  name?: string
  model_insights?: "flash" | "plus" | "flash-thinking" | "plus-thinking"
}

export type JobStatus = {
  job_id: string
  status: "processing" | "done" | "error"
  results: any
  partial_results?: any
  error?: string
  created_at?: string
  updated_at?: string
  status_url?: string
  events_url?: string
}

export function getJobProgress(job: JobStatus): AnalysisPhase | null {
  const progress = job.status === "processing" ? (job.results ?? job.partial_results) : null
  return progress && typeof progress === "object" ? progress as AnalysisPhase : null
}

function getHeaders(config: ReturnType<typeof getKawoConfig>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.token}`,
  }
  if (config.orgId) headers['X-KAWO-Org-Id'] = config.orgId
  if (config.brandId) headers['X-KAWO-Brand-Id'] = config.brandId
  return headers
}

export async function createAnalysisJob(
  payload: ContentAnalysisRequest
): Promise<{ job_id: string; source_id?: string }> {
  const config = getKawoConfig()

  if (!config.apiUrl || !config.token) {
    throw new Error('KAWO credentials not configured')
  }

  const targetUrl = `${config.apiUrl.replace(/\/$/, '')}/content-analysis/jobs`

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({ ...payload, internal: false }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Analysis job creation failed: ${response.statusText} - ${text}`)
  }

  return response.json()
}

export async function createBatchAnalysisJob(
  payload: BatchAnalysisRequest
): Promise<{ job_id: string; source_id?: string }> {
  const config = getKawoConfig()

  if (!config.apiUrl || !config.token) {
    throw new Error('KAWO credentials not configured')
  }

  const targetUrl = `${config.apiUrl.replace(/\/$/, '')}/content-analysis/batch-jobs`

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({ ...payload, internal: false }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Batch analysis job creation failed: ${response.statusText} - ${text}`)
  }

  return response.json()
}

export async function pollJob(job_id: string): Promise<JobStatus> {
  const config = getKawoConfig()

  if (!config.apiUrl || !config.token) {
    throw new Error('KAWO credentials not configured')
  }

  const targetUrl = `${config.apiUrl.replace(/\/$/, '')}/content-analysis/jobs/${encodeURIComponent(job_id)}`

  const response = await fetch(targetUrl, {
    headers: getHeaders(config),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Job poll failed: ${response.statusText} - ${text}`)
  }

  return response.json()
}
