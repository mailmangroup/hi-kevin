
import { getKawoConfig } from './client'

export type AnalysisPhase = {
  phase: number | string
  message?: string
  source_id?: string
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

export async function* batchAnalyzeContentStream(
  payload: BatchAnalysisRequest
): AsyncGenerator<AnalysisPhase, void, unknown> {
  const config = getKawoConfig()

  if (!config.apiUrl || !config.token || !config.orgId || !config.brandId) {
    throw new Error('KAWO credentials not configured')
  }

  const targetUrl = `${config.apiUrl.replace(/\/$/, '')}/content-analysis/batch-analyze`

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
      'X-KAWO-Org-Id': config.orgId,
      'X-KAWO-Brand-Id': config.brandId,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Batch analysis failed: ${response.statusText} - ${text}`)
  }

  if (!response.body) throw new Error("No response body")

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        try {
          const parsed = JSON.parse(data)
          yield parsed
        } catch (e) {
          console.error('Error parsing SSE data:', e)
        }
      }
    }
  }
}

export async function* analyzeContentStream(
  payload: ContentAnalysisRequest
): AsyncGenerator<AnalysisPhase, void, unknown> {
  const config = getKawoConfig()

  if (!config.apiUrl || !config.token || !config.orgId || !config.brandId) {
    throw new Error('KAWO credentials not configured')
  }

  const targetUrl = `${config.apiUrl.replace(/\/$/, '')}/content-analysis/analyze`

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
      'X-KAWO-Org-Id': config.orgId,
      'X-KAWO-Brand-Id': config.brandId,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Analysis failed: ${response.statusText} - ${text}`)
  }

  if (!response.body) throw new Error("No response body")

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        try {
          const parsed = JSON.parse(data)
          yield parsed
        } catch (e) {
          console.error('Error parsing SSE data:', e)
        }
      }
    }
  }
}
