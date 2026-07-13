import { directApiCall } from "./client"
import type { BatchVideoRecord } from "@/lib/utils/batch-video-processor"

export type BatchVideoJobStatus = {
  job_id: string
  status: "processing" | "done" | "error"
  results: any
  error?: string
}

export type BatchVideoAnalysisSource = {
  id: string
  name: string
  updated_at?: string
  video_count?: number
  reviewable_count?: number
  violation_count?: number
}

export async function createBatchVideoAnalysisJob(payload: {
  records: BatchVideoRecord[]
  name?: string
  audit_period?: string
  audit_categories?: { name: string; description: string }[]
  analysis_target?: string
  judgment_rules?: string[]
  limit?: number
  thinking_enabled?: boolean
}): Promise<{ job_id: string; source_id?: string }> {
  return directApiCall("batch-video-analysis/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
    includeOrgBrandHeaders: false,
  })
}

export async function pollBatchVideoAnalysisJob(jobId: string): Promise<BatchVideoJobStatus> {
  return directApiCall(`batch-video-analysis/jobs/${encodeURIComponent(jobId)}`, {
    includeOrgBrandHeaders: false,
  })
}

export async function listBatchVideoAnalysisSources(): Promise<{ sources: BatchVideoAnalysisSource[] }> {
  return directApiCall("batch-video-analysis/data-sources", {
    includeOrgBrandHeaders: false,
  })
}

export async function getBatchVideoAnalysisReport<T>(sourceId: string): Promise<T> {
  return directApiCall(`batch-video-analysis?source_id=${encodeURIComponent(sourceId)}`, {
    includeOrgBrandHeaders: false,
  })
}

export async function deleteBatchVideoAnalysisSource(sourceId: string): Promise<void> {
  await directApiCall(`batch-video-analysis/data-sources/${encodeURIComponent(sourceId)}`, {
    method: "DELETE",
    includeOrgBrandHeaders: false,
  })
}
