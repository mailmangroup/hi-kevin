
import ExcelJS from 'exceljs'

export type ProcessedComment = {
  content: string
  transcript?: string
  imageDescription?: string
  post_content?: string
  date?: string
  likes?: number
  replies?: number
  location?: string
  _original_data?: Record<string, any>
}

const KEYWORDS = {
  body: ['内容', '评价', '正文', 'review', 'body', 'text', 'content'],
  date: ['时间', '日期', 'date', 'time', '发布'],
  likes: ['点赞', 'like', '赞'],
  replies: ['回复', 'reply', 'comment', '评论数'],
  location: ['ip属地', '属地', '地区', 'location', 'province', '省份', '城市'],
  image: ['图片描述', '图片说明', 'image_description', 'image description', 'img_desc'],
  transcript: ['文案', '字幕', 'transcript', 'caption'],
}

function findColumn(headers: string[], keywords: string[]): string | undefined {
  for (const header of headers) {
    const h = String(header).toLowerCase()
    if (keywords.some((kw) => h.includes(kw))) {
      return header
    }
  }
  return undefined
}

export async function processFile(file: File): Promise<ProcessedComment[]> {
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  
  if (file.name.endsWith('.csv')) {
    await workbook.csv.load(buffer)
  } else {
    await workbook.xlsx.load(buffer)
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error('No worksheet found')
  }

  // Get headers from first row
  const headers: string[] = []
  const firstRow = worksheet.getRow(1)
  firstRow.eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value)
  })
  
  // Filter out empty headers (ExcelJS uses 1-based indexing, so index 0 is empty)
  const validHeaders = headers.filter(h => h)

  const colMap = {
    body: findColumn(validHeaders, KEYWORDS.body),
    date: findColumn(validHeaders, KEYWORDS.date),
    likes: findColumn(validHeaders, KEYWORDS.likes),
    replies: findColumn(validHeaders, KEYWORDS.replies),
    location: findColumn(validHeaders, KEYWORDS.location),
    image: findColumn(validHeaders, KEYWORDS.image),
    transcript: findColumn(validHeaders, KEYWORDS.transcript),
  }

  if (!colMap.body) {
    throw new Error(`Could not find a content column. Looked for: ${KEYWORDS.body.join(', ')}`)
  }

  // Avoid matching transcript to the body column
  if (colMap.transcript && colMap.transcript === colMap.body) {
    colMap.transcript = undefined
  }

  const comments: ProcessedComment[] = []

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Skip header

    const rowData: Record<string, any> = {}
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber]
      if (header) {
        rowData[header] = cell.value
      }
    })

    const bodyVal = rowData[colMap.body!]
    let bodyText = bodyVal ? String(bodyVal).trim() : ''

    // Skip empty or too short
    if (!bodyText || bodyText.toLowerCase() === 'nan' || bodyText.length < 3) {
      return
    }

    // Transcript concatenation
    let transcriptText = ''
    if (colMap.transcript) {
      const tVal = rowData[colMap.transcript]
      if (tVal && String(tVal).toLowerCase() !== 'nan') {
        transcriptText = String(tVal).trim()
      }
    }

    // Image description concatenation
    let imageDesc = ''
    if (colMap.image) {
      const iVal = rowData[colMap.image]
      if (iVal && String(iVal).toLowerCase() !== 'nan') {
        imageDesc = String(iVal).trim()
      }
    }

    // Helper for safe int
    const safeInt = (val: any) => {
      if (!val) return 0
      const n = parseInt(String(val), 10)
      return isNaN(n) ? 0 : n
    }

    comments.push({
      content: bodyText,
      transcript: transcriptText,
      imageDescription: imageDesc,
      date: colMap.date ? String(rowData[colMap.date]) : undefined,
      likes: colMap.likes ? safeInt(rowData[colMap.likes]) : 0,
      replies: colMap.replies ? safeInt(rowData[colMap.replies]) : 0,
      location: colMap.location ? String(rowData[colMap.location]) : undefined,
      _original_data: rowData,
    })
  })

  return comments
}
