export interface Report {
  id: string
  title: string
  pages: ReportPage[]
  metadata: {
    start_date: number
    end_date: number
    prev_start_date?: number
    prev_end_date?: number
    language: "en" | "cn"
    generated_at: string
  }
}

export interface ReportPage {
  title: string
  sections: ReportSection[]
}

export interface ReportSection {
  type: "TEXT" | "CHART" | "TABLE" | "STAT_TILES"
  title?: string
  content?: string
  data?: any
}

// Chart types
export interface ChartData {
  chartType: "bar" | "line" | "pie" | "area"
  title?: string
  description?: string
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
  }[]
}

// Table types
export interface TableData {
  headers: string[]
  rows: (string | number)[][]
}

// Stat Tiles types
export interface StatTileData {
  label: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
}
