"use client"

import * as React from "react"
import { X, Download, Copy, Check, BarChart3, Code, Table2, FileText, ChevronDown, RefreshCw, ExternalLink, Maximize2, Minimize2, ArrowUp, ArrowDown, Minus, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { useArtifact, ArtifactData, ReportNavigation } from "./artifact-context"
import { MessageContent } from "./message-content"
import { BrandPostsArtifact } from "./brand-posts-artifact"
import { WebSearchArtifact } from "./web-search-artifact"
import { HelpCenterArtifact } from "./help-center-artifact"
import { formatDateRangeDisplay } from "@/lib/utils/date-range"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"

const ARTIFACT_ICONS = {
  chart: BarChart3,
  code: Code,
  table: Table2,
  report: FileText,
  data: FileText,
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_account_insights: "Account Insights",
  get_content_performance: "Content Performance",
  search_web: "Web Search Results",
  web_search: "Web Search Results",
  analyze_competitors: "Competitor Analysis",
  generate_content: "Generated Content",
  schedule_post: "Scheduled Post",
  get_audience_data: "Audience Data",
}

export function ArtifactPanel() {
  const { selectedArtifact, isPanelOpen, closePanel } = useArtifact()
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!selectedArtifact) return
    try {
      const content = typeof selectedArtifact.data === "string"
        ? selectedArtifact.data
        : JSON.stringify(selectedArtifact.data, null, 2)
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (!isPanelOpen || !selectedArtifact) return null

  const Icon = ARTIFACT_ICONS[selectedArtifact.type] || FileText
  const title = selectedArtifact.title ||
    (selectedArtifact.toolName ? TOOL_DISPLAY_NAMES[selectedArtifact.toolName] : null) ||
    getDefaultTitle(selectedArtifact.type)

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border bg-white transition-all duration-300 h-full w-[600px] max-w-full"
      )}
    >
      {/* Content Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
            <span className="font-medium text-sm text-gray-900 flex-shrink-0">{title}</span>
            {(selectedArtifact.toolName || selectedArtifact.session) && (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedArtifact.toolName && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">
                    {selectedArtifact.toolName}
                  </span>
                )}
                {selectedArtifact.session?.date_start && selectedArtifact.session?.date_end && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">
                    {selectedArtifact.session.date_start} - {selectedArtifact.session.date_end}
                  </span>
                )}
                {selectedArtifact.session?.networks && selectedArtifact.session.networks.length > 0 && (
                  selectedArtifact.session.networks.map((network, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200"
                    >
                      {network}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Copy content"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-600" />
              )}
            </button>
            <button
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="More options"
            >
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={closePanel}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <ArtifactPanelContent artifact={selectedArtifact} />
        </div>
      </div>
    </div>
  )
}

function ArtifactPanelContent({ artifact }: { artifact: ArtifactData }) {
  // Check for brand posts
  const isBrandPosts = (data: any, toolName?: string) => {
    // Explicitly check for specific tools
    if (toolName === 'analyze_brand_content' || toolName === 'search_post' || toolName === 'get_brand_posts') return true

    if (!data) return false
    // Check if it's the brand posts structure
    if (Array.isArray(data) && data.length > 0 && (data[0].brandId || data[0].publishId)) return true
    if (data.brand_posts && Array.isArray(data.brand_posts)) return true
    // Check if string and looks like brand posts
    if (typeof data === 'string' && (data.includes('brandId') || data.includes('brand_posts'))) {
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].brandId || parsed[0].publishId)) return true;
            if (parsed.brand_posts && Array.isArray(parsed.brand_posts)) return true;
        } catch (e) {
            return false;
        }
    }
    return false
  }

  // Check for web search results
  const isWebSearch = (data: any, toolName?: string) => {
    // Explicitly check for specific tools
    if (toolName === 'search_web' || toolName === 'web_search') return true

    if (!data) return false
    // Check if it's the web search structure
    if (Array.isArray(data)) {
      // Check if array elements are web search results
      if (data.length > 0 && data[0]?.type === "web_search_result") return true
      // Check if array contains objects with cards property
      if (data.length > 0 && data[0]?.cards && Array.isArray(data[0].cards)) {
        return data[0].cards.some((card: any) => card?.type === "web_search_result")
      }
    }
    if (data.cards && Array.isArray(data.cards)) {
      return data.cards.some((card: any) => card?.type === "web_search_result")
    }
    if (data.type === "web_search_result") return true
    // Check if string and looks like web search
    if (typeof data === 'string' && (data.includes('web_search_result') || data.includes('"cards"'))) {
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              if (parsed.length > 0 && parsed[0]?.type === "web_search_result") return true;
              if (parsed.length > 0 && parsed[0]?.cards) {
                return parsed[0].cards.some((card: any) => card?.type === "web_search_result");
              }
            }
            if (parsed.cards && Array.isArray(parsed.cards)) {
              return parsed.cards.some((card: any) => card?.type === "web_search_result");
            }
            if (parsed.type === "web_search_result") return true;
        } catch (e) {
            return false;
        }
    }
    return false
  }

  const isHelpCenter = (data: any, toolName?: string) => {
    if (toolName === 'kawo_website_search') return true
    if (!data) return false
    if (data.data && Array.isArray(data.data)) {
      const hasHelpCenterCards = data.data.some((section: any) =>
        section.cards && Array.isArray(section.cards) &&
        section.cards.some((card: any) => card.type === "helpcenter_article")
      )
      if (hasHelpCenterCards) return true
    }
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0]?.type === "helpcenter_article") return true
      if (data.length > 0 && data[0]?.cards && Array.isArray(data[0].cards)) {
        return data[0].cards.some((card: any) => card?.type === "helpcenter_article")
      }
    }
    if (data.cards && Array.isArray(data.cards)) {
      return data.cards.some((card: any) => card?.type === "helpcenter_article")
    }
    if (data.type === "helpcenter_article") return true
    try {
      const str = JSON.stringify(data);
      if (str.includes('"type":"helpcenter_article"')) return true;
    } catch (e) {}
    if (typeof data === 'string' && (data.includes('helpcenter_article'))) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && parsed[0]?.type === "helpcenter_article") return true;
          if (parsed.length > 0 && parsed[0]?.cards) {
            return parsed[0].cards.some((card: any) => card?.type === "helpcenter_article");
          }
        }
        if (parsed.cards && Array.isArray(parsed.cards)) {
          return parsed.cards.some((card: any) => card?.type === "helpcenter_article");
        }
        if (parsed.type === "helpcenter_article") return true;
      } catch (e) {
        return false;
      }
    }
    return false
  }

  if (isBrandPosts(artifact.data, artifact.toolName)) {
    let data = artifact.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse brand posts data", e)
        return <div className="p-4 text-red-500">Failed to parse brand posts data: {String(e)}</div>
      }
    }
    return <BrandPostsArtifact data={data} />
  }

  if (isWebSearch(artifact.data, artifact.toolName)) {
    let data = artifact.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse web search data", e)
        return <div className="p-4 text-red-500">Failed to parse web search data: {String(e)}</div>
      }
    }
    return <WebSearchArtifact data={data} />
  }

  if (isHelpCenter(artifact.data, artifact.toolName)) {
    let data = artifact.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse help center data", e)
        return <div className="p-4 text-red-500">Failed to parse help center data: {String(e)}</div>
      }
    }
    return <HelpCenterArtifact data={data} />
  }

  switch (artifact.type) {
    case "chart":
      return <ChartContent data={artifact.data} />
    case "code":
      return <CodeContent data={artifact.data} />
    case "table":
      return <TableContent data={artifact.data} />
    case "report":
      return <ReportContent data={artifact.data} />
    default:
      return <DataContent data={artifact.data} />
  }
}

function ChartContent({ data }: { data: any }) {
  if (data?.chartType || data?.config) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          {data.title || "Chart visualization"}
        </p>
        {data.description && (
          <p className="text-xs text-gray-400 mt-2">{data.description}</p>
        )}
      </div>
    )
  }
  return <DataContent data={data} />
}

function CodeContent({ data }: { data: any }) {
  const code = typeof data === "string" ? data : data?.code || JSON.stringify(data, null, 2)

  return (
    <div className="overflow-x-auto">
      <pre className="text-sm font-mono overflow-x-auto p-4 bg-gray-900 text-gray-100 rounded-lg border border-gray-700">
        <code className="text-gray-100">{code}</code>
      </pre>
    </div>
  )
}

function TableContent({ data }: { data: any }) {
  // Check if this is brand posts data (using same logic as artifact-display.tsx)
  const isBrandPosts = (data: any) => {
    if (!data) return false
    // Check if it's the brand posts structure
    if (Array.isArray(data) && data.length > 0 && (data[0].brandId || data[0].publishId)) return true
    if (data.brand_posts && Array.isArray(data.brand_posts)) return true
    // Check if string and looks like brand posts
    if (typeof data === 'string' && (data.includes('brandId') || data.includes('brand_posts'))) {
      try {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].brandId || parsed[0].publishId)) return true
        if (parsed.brand_posts && Array.isArray(parsed.brand_posts)) return true
      } catch (e) {
        return false
      }
    }
    return false
  }

  // Check if this is web search data
  const isWebSearch = (data: any) => {
    if (!data) return false
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0]?.type === "web_search_result") return true
      if (data.length > 0 && data[0]?.cards && Array.isArray(data[0].cards)) {
        return data[0].cards.some((card: any) => card?.type === "web_search_result")
      }
    }
    if (data.cards && Array.isArray(data.cards)) {
      return data.cards.some((card: any) => card?.type === "web_search_result")
    }
    if (data.type === "web_search_result") return true
    if (typeof data === 'string' && (data.includes('web_search_result') || data.includes('"cards"'))) {
      try {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && parsed[0]?.type === "web_search_result") return true
          if (parsed.length > 0 && parsed[0]?.cards) {
            return parsed[0].cards.some((card: any) => card?.type === "web_search_result")
          }
        }
        if (parsed.cards && Array.isArray(parsed.cards)) {
          return parsed.cards.some((card: any) => card?.type === "web_search_result")
        }
        if (parsed.type === "web_search_result") return true
      } catch (e) {
        return false
      }
    }
    return false
  }

  if (isBrandPosts(data)) {
    let brandPostsData = data
    if (typeof data === 'string') {
      try {
        brandPostsData = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse brand posts data in TableContent", e)
        return <div className="p-4 text-red-500">Failed to parse brand posts data: {String(e)}</div>
      }
    }
    return <BrandPostsArtifact data={brandPostsData} />
  }

  if (isWebSearch(data)) {
    let webSearchData = data
    if (typeof data === 'string') {
      try {
        webSearchData = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse web search data in TableContent", e)
        return <div className="p-4 text-red-500">Failed to parse web search data: {String(e)}</div>
      }
    }
    return <WebSearchArtifact data={webSearchData} />
  }

  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0])

    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {formatHeader(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {headers.map((header) => (
                  <td key={header} className="px-4 py-3 text-sm text-gray-600">
                    {formatCellValue(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Handle structured table data { headers: [], rows: [] }
  if (data && typeof data === 'object' && Array.isArray(data.headers) && Array.isArray(data.rows)) {
    const { headers, rows } = data
    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header: any, idx: number) => (
                <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {formatCellValue(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.map((row: any[], idx: number) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {row.map((cell: any, cIdx: number) => (
                  <td key={cIdx} className="px-4 py-3 text-sm text-gray-600">
                    {formatCellValue(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (typeof data === "string" && data.includes("|")) {
    return (
      <div className="prose prose-sm max-w-none">
        <MessageContent content={data} />
      </div>
    )
  }

  return <DataContent data={data} />
}

function ReportContent({ data }: { data: any }) {
  const { reportNavigation, setReportNavigation } = useArtifact()
  const [activePage, setActivePage] = React.useState(0)

  // Sync activePage with reportNavigation from context
  React.useEffect(() => {
      if (reportNavigation.pageNumber > 0 && reportNavigation.pageNumber - 1 !== activePage) {
          // Only switch if the page actually exists
          if (data?.pages && data.pages[reportNavigation.pageNumber - 1]) {
              setActivePage(reportNavigation.pageNumber - 1)
          }
      }
  }, [reportNavigation.pageNumber, data])

  // Support for new Report structure with pages
  if (data?.pages && Array.isArray(data.pages)) {
    // Note: We removed IntersectionObserver for auto-tracking sections 
    // to support "manual attach" mode as requested.
    // Navigation is now updated via Tabs (for page) and "Chat" button (for section).

    const handleTabChange = (index: number) => {
        setActivePage(index)
        setReportNavigation(prev => ({
            ...prev,
            pageNumber: index + 1,
            sectionIndexes: []
        }))
        // Scroll parent to top
        const panel = document.querySelector('.overflow-y-auto')
        if (panel) panel.scrollTop = 0
    }

    return (
      <div className="space-y-8 pb-8">
        {/* Report Header - Sticky */}
        <div className="sticky -top-6 -mx-6 px-6 py-4 bg-white/95 backdrop-blur z-10 border-b shadow-sm space-y-4">
          <div className="space-y-2">
            {data.title && (
                <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
            )}
            {data.metadata && (
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <span className="font-medium">Period:</span>
                    <span>
                    {formatDateRangeDisplay(
                        new Date(data.metadata.start_date), 
                        new Date(data.metadata.end_date)
                    )}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-medium">Language:</span>
                    <span className="uppercase">{data.metadata.language}</span>
                </div>
                {data.metadata.generated_at && (
                    <div className="flex items-center gap-1">
                    <span className="font-medium">Generated:</span>
                    <span>{new Date(data.metadata.generated_at).toLocaleDateString()}</span>
                    </div>
                )}
                </div>
            )}
          </div>

          {/* Page Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
              {data.pages.map((page: any, idx: number) => (
                  <Button
                      key={idx}
                      variant={activePage === idx ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTabChange(idx)}
                      className={cn(
                          "whitespace-nowrap flex-shrink-0 h-8 text-xs",
                          activePage === idx ? "bg-primary text-white" : "text-gray-600 bg-gray-50 border-gray-200"
                      )}
                  >
                      {page.title || `Page ${idx + 1}`}
                  </Button>
              ))}
          </div>
        </div>

        {/* Active Page Content */}
        {data.pages[activePage] && (
          <div className="space-y-6" data-page={activePage + 1}>
            <h2 className="text-xl font-semibold text-gray-800 pb-2 border-b border-gray-100">
              {data.pages[activePage].title}
            </h2>
            <div className="space-y-12">
              {data.pages[activePage].sections.map((section: any, sIdx: number) => (
                <div key={sIdx} data-section={sIdx + 1} data-page={activePage + 1}>
                    <ReportSectionRenderer 
                        section={section} 
                        pageIndex={activePage + 1}
                        sectionIndex={sIdx + 1}
                    />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Legacy support
  if (data?.sections || data?.content) {
    return (
      <div className="space-y-6">
        {data.title && (
          <h3 className="text-lg font-semibold text-gray-800">{data.title}</h3>
        )}
        {data.content && (
          <MessageContent content={data.content} />
        )}
        {data.sections?.map((section: any, idx: number) => (
          <div key={idx} className="space-y-3">
            {section.title && (
              <h4 className="text-sm font-semibold text-gray-700">{section.title}</h4>
            )}
            <MessageContent content={section.content} className="text-gray-600" />
          </div>
        ))}
      </div>
    )
  }

  if (typeof data === "string") {
    return (
      <div className="prose prose-sm max-w-none">
        <MessageContent content={data} />
      </div>
    )
  }

  return <DataContent data={data} />
}

const NETWORK_ICONS: Record<string, string> = {
  wechat: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/wechat.svg",
  sweibo: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/weibo.svg",
  douyin: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/douyin.svg",
  kuaishou: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/kuaishou.svg",
  bilibili: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/bilibili.svg",
  xhs: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/xhs.svg",
  instagram: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/instagram.svg",
  facebook: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/facebook.svg",
  linkedin: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/linkedin.svg",
  twitter: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/twitter.svg",
  youtube: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/youtube.svg",
  tiktok: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/tiktok.svg",
  sph: "https://raw.githubusercontent.com/kawo-platform/kawo-icons/master/networks/channels.svg",
}

function SectionTitle({ title }: { title: string }) {
  if (!title) return null

  // Check for network icon tag: <network-icon network="xyz" />
  const match = title.match(/<network-icon network="([^"]+)"\s*\/>\s*(.*)/)
  
  if (match) {
    const network = match[1]
    const text = match[2]
    const iconUrl = NETWORK_ICONS[network.toLowerCase()]

    return (
      <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
        {iconUrl ? (
           <img src={iconUrl} alt={network} className="w-5 h-5 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
        ) : (
           <span className="capitalize">{network}</span>
        )}
        <span>{text}</span>
      </div>
    )
  }

  return <h3 className="text-base font-semibold text-gray-800">{title}</h3>
}

function ReportSectionRenderer({ section, pageIndex, sectionIndex }: { section: any, pageIndex?: number, sectionIndex?: number }) {
  const { type, title, description, content, data, insights, stat_tiles, table_data, chart_spec } = section
  const { setReportNavigation } = useArtifact()

  const handleChatToKevin = () => {
      // 1. Update navigation context
      if (pageIndex && sectionIndex) {
          setReportNavigation({
              pageNumber: pageIndex,
              sectionIndexes: [sectionIndex]
          })
      }
      
      // 2. Focus chat and set text
      const event = new CustomEvent('chat-focus-input', {
          detail: { text: `Regarding "${title?.replace(/<[^>]+>/g, '').trim() || 'this section'}": ` }
      })
      window.dispatchEvent(event)
  }

  return (
    <div className="space-y-4 group relative">
      <div className="flex items-start justify-between gap-4">
          <SectionTitle title={title} />
          {/* Chat Button */}
          <Button
              variant="ghost"
              size="sm"
              onClick={handleChatToKevin}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
              title="Chat with Kevin about this section"
          >
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-medium">Chat</span>
          </Button>
      </div>
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      {insights && Array.isArray(insights) && insights.length > 0 && (
        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
          <div className="space-y-2">
            {insights.map((insight: string, idx: number) => (
               <MessageContent key={idx} content={insight} className="text-sm text-gray-700" />
            ))}
          </div>
        </div>
      )}

      {content && (
        <MessageContent content={content} className="text-sm text-gray-600" />
      )}

      {/* Handle Charts */}
      {(type === "chart" || type === "CHART") && (chart_spec || data) && (
        <div className="h-[300px] w-full border rounded-lg p-4 bg-white shadow-sm">
          <ReportChart data={chart_spec || data} />
        </div>
      )}

      {/* Handle Tables */}
      {(type === "table" || type === "TABLE") && (table_data || data) && (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <TableContent data={table_data || data} />
        </div>
      )}

      {/* Handle Stat Tiles */}
      {(type === "stat_tiles" || type === "STAT_TILES") && (stat_tiles || data) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(stat_tiles || data).map((tile: any, idx: number) => (
            <StatTile key={idx} data={tile} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatTile({ data }: { data: any }) {
  const { label, value, change, trend } = data
  
  return (
    <div className="p-4 rounded-lg bg-white border shadow-sm">
      <div className="text-xs text-gray-500 font-medium truncate" title={label}>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
      {typeof change !== 'undefined' && (
        <div className={cn(
          "mt-1 text-xs font-medium flex items-center gap-0.5",
          trend === 'up' ? "text-green-600" : 
          trend === 'down' ? "text-red-600" : 
          "text-gray-500"
        )}>
          {trend === 'up' && <ArrowUp className="h-3 w-3" />}
          {trend === 'down' && <ArrowDown className="h-3 w-3" />}
          {trend === 'neutral' && <Minus className="h-3 w-3" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
  )
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function ReportChart({ data }: { data: any }) {
  const { chartType: legacyType, labels: legacyLabels, datasets: legacyDatasets, chart_type: newType, series } = data
  
  const chartType = legacyType || newType
  
  // Normalize data to Recharts format
  let chartData: any[] = []
  let datasets: any[] = []

  if (series && Array.isArray(series)) {
      // New format: series with x and y
      // Assuming all series share the same x-axis values (or we take the first one)
      if (series.length > 0 && series[0].x) {
          const xValues = series[0].x
          chartData = xValues.map((xVal: any, idx: number) => {
              const item: any = { name: xVal }
              series.forEach((s: any) => {
                  item[s.name] = s.y[idx]
              })
              return item
          })
          
          datasets = series.map((s: any) => ({
              label: s.name,
              data: s.y, // Not strictly needed for Recharts but good for reference
              borderColor: s.color,
              backgroundColor: s.color
          }))
      }
  } else if (legacyLabels && legacyDatasets) {
      // Legacy format
      chartData = legacyLabels.map((label: string, idx: number) => {
        const item: any = { name: label }
        legacyDatasets.forEach((ds: any) => {
          item[ds.label] = ds.data[idx]
        })
        return item
      })
      datasets = legacyDatasets
  }

  if (chartType === 'pie') {
    // Pie chart needs different format
    // For new format, we might need to adapt if it comes as series
    // But usually pie chart series is just one series with labels as x and values as y
    let pieData: any[] = []
    
    if (series && series.length > 0) {
        // Assume first series has x as labels and y as values
        pieData = series[0].x.map((label: string, idx: number) => ({
            name: label,
            value: series[0].y[idx]
        }))
    } else if (legacyLabels && legacyDatasets) {
        pieData = legacyLabels.map((label: string, idx: number) => ({
          name: label,
          value: legacyDatasets[0].data[idx]
        }))
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const ChartComponent = chartType === 'line' ? LineChart : 
                         chartType === 'area' ? AreaChart : 
                         BarChart

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartComponent
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Legend />
        {datasets.map((ds: any, idx: number) => {
          if (chartType === 'line') {
            return (
              <Line 
                key={idx} 
                type="monotone" 
                dataKey={ds.label} 
                stroke={ds.borderColor || COLORS[idx % COLORS.length]} 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )
          }
          if (chartType === 'area') {
            return (
              <Area 
                key={idx} 
                type="monotone" 
                dataKey={ds.label} 
                stackId="1" 
                stroke={ds.borderColor || COLORS[idx % COLORS.length]} 
                fill={ds.backgroundColor || COLORS[idx % COLORS.length]} 
                fillOpacity={0.6}
              />
            )
          }
          return (
            <Bar 
              key={idx} 
              dataKey={ds.label} 
              fill={ds.backgroundColor || COLORS[idx % COLORS.length]} 
              radius={[4, 4, 0, 0]} 
            />
          )
        })}
      </ChartComponent>
    </ResponsiveContainer>
  )
}

function DataContent({ data }: { data: any }) {
  if (typeof data === "string") {
    if (data.includes("**") || data.includes("##") || data.includes("- ") || data.includes("|") || data.includes("```")) {
      return (
        <div className="prose prose-sm max-w-none">
          <MessageContent content={data} />
        </div>
      )
    }
    return <p className="text-sm text-gray-600 leading-relaxed">{data}</p>
  }

  // Check for markdown_summary in nested objects
  const summaries = extractAllSummaries(data)
  if (summaries.length > 0) {
    return (
      <div className="space-y-4">
        {summaries.map((summary, idx) => (
          <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
            {summary.accountName && (
              <div className="text-sm font-medium text-gray-700 mb-2">
                {summary.accountName}
              </div>
            )}
            <MessageContent content={summary.markdown} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <pre className="text-sm overflow-x-auto text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

// Helper functions
function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    chart: "Chart",
    code: "Code",
    table: "Table",
    report: "Report",
    data: "Data",
  }
  return titles[type] || "Artifact"
}

function formatHeader(header: string): string {
  return header
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

interface Summary {
  accountName?: string
  markdown: string
}

function extractAllSummaries(output: any): Summary[] {
  const summaries: Summary[] = []
  if (!output || typeof output !== "object") return summaries

  for (const [network, data] of Object.entries(output)) {
    if (data && typeof data === "object" && (data as any).markdown_summary) {
      summaries.push({
        accountName: (data as any).account?.name,
        markdown: (data as any).markdown_summary,
      })
    }
  }

  return summaries
}
