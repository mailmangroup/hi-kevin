export type BatchVideoRecord = {
  item_id: string
  url?: string
  account_name?: string
  account_desc?: string
  post_title?: string
  post_desc?: string
  publish_time?: string
  transcript?: string
}

export type BatchVideoParseResult = {
  records: BatchVideoRecord[]
  totalLinks: number
  totalTasks: number
  matchedTasks: number
  reviewableTranscripts: number
  missingTranscripts: number
}

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === "object") {
    const obj = value as Record<string, any>
    for (const key of ["data", "rows", "items", "records"]) {
      if (Array.isArray(obj[key])) return obj[key]
    }
  }
  return []
}

async function readJsonFile(file: File) {
  const text = await file.text()
  return JSON.parse(text)
}

function looksLikeLinkRows(rows: any[]) {
  return rows.some((row) => row?.itemId && row?.url)
}

function transcriptFromTask(task: any) {
  const videoTask = Array.isArray(task?.videoTasks) ? task.videoTasks[0] : null
  const transcriptRows = videoTask?.taskResult?.audio_transcript
  if (!Array.isArray(transcriptRows)) return ""
  return transcriptRows
    .map((row) => row?.text)
    .filter((text) => typeof text === "string" && text.trim())
    .join("\n")
    .trim()
}

export async function processBatchVideoFiles(fileA: File, fileB: File): Promise<BatchVideoParseResult> {
  const parsedA = asArray(await readJsonFile(fileA))
  const parsedB = asArray(await readJsonFile(fileB))
  const linkRows = looksLikeLinkRows(parsedA) ? parsedA : parsedB
  const taskRows = linkRows === parsedA ? parsedB : parsedA

  if (!linkRows.length || !taskRows.length) {
    throw new Error("Upload the Qingbo DyItem links JSON and DyItemTask analysis JSON. Both files must contain arrays.")
  }
  if (!looksLikeLinkRows(linkRows)) {
    throw new Error("Could not identify the DyItem links JSON. Expected one file with rows containing itemId and url.")
  }

  const linksByItemId = new Map<string, string>()
  linkRows.forEach((row) => {
    if (row?.itemId) linksByItemId.set(String(row.itemId), String(row.url || ""))
  })

  const records: BatchVideoRecord[] = []
  taskRows.forEach((task) => {
    const itemId = task?.itemId ? String(task.itemId) : ""
    if (!itemId || !linksByItemId.has(itemId)) return

    const videoTask = Array.isArray(task.videoTasks) ? task.videoTasks[0] : null
    const request = videoTask?.taskRequest || {}
    records.push({
      item_id: itemId,
      url: linksByItemId.get(itemId),
      account_name: request.account_name || "",
      account_desc: request.account_desc || "",
      post_title: request.post_title || "",
      post_desc: request.post_desc || "",
      publish_time: request.publish_time || "",
      transcript: transcriptFromTask(task),
    })
  })

  const reviewableTranscripts = records.filter((record) => record.transcript?.trim()).length
  return {
    records,
    totalLinks: linkRows.length,
    totalTasks: taskRows.length,
    matchedTasks: records.length,
    reviewableTranscripts,
    missingTranscripts: records.length - reviewableTranscripts,
  }
}
