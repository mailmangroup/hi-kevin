export function determineArtifactType(artifact: any, toolName?: string): "chart" | "code" | "table" | "report" | "data" | "html" | "markdown" | "mermaid" | "file" {
  if (artifact?.oss_key && artifact?.filename) return "file"
  if (artifact?.type === "artifact" && artifact?.artifact_type) {
    return artifact.artifact_type
  }
  if (artifact?.type && artifact.type !== "artifact") {
    return artifact.type
  }
  if (toolName) {
    if (toolName.includes("chart") || toolName.includes("analytics")) {
      return "chart"
    }
    if (toolName.includes("code") || toolName.includes("generate")) {
      return "code"
    }
    if (toolName.includes("table") || toolName.includes("data")) {
      return "table"
    }
    if (toolName.includes("report") || toolName.includes("insights") || toolName.includes("performance")) {
      return "report"
    }
  }
  if (artifact?.data) {
    if (Array.isArray(artifact.data)) {
      return "table"
    }
    if (typeof artifact.data === "string" && artifact.data.includes("```")) {
      return "code"
    }
  }
  return "data"
}

export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_account_insights: "Account Insights",
  get_content_performance: "Content Performance",
  search_web: "Web Search Results",
  analyze_competitors: "Competitor Analysis",
  generate_content: "Generated Content",
  schedule_post: "Scheduled Post",
  get_audience_data: "Audience Data",
  write_file: "Written File",
}

export function getToolDisplayName(toolName: string): string {
  return TOOL_DISPLAY_NAMES[toolName] || toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}
