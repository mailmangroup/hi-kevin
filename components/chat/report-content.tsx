"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { useArtifact } from "./artifact-context"
import { MessageContent } from "./message-content"
import { formatDateRangeDisplay } from "@/lib/utils/date-range"
import { TableContent, DataContent } from "./artifact-renderers"
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

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function SectionTitle({ title }: { title: string }) {
  if (!title) return null

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

function ReportChart({ data }: { data: any }) {
  const { chartType: legacyType, labels: legacyLabels, datasets: legacyDatasets, chart_type: newType, series } = data

  const chartType = legacyType || newType

  let chartData: any[] = []
  let datasets: any[] = []

  if (series && Array.isArray(series)) {
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
              data: s.y,
              borderColor: s.color,
              backgroundColor: s.color
          }))
      }
  } else if (legacyLabels && legacyDatasets) {
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
    let pieData: any[] = []

    if (series && series.length > 0) {
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

function ReportSectionRenderer({ section, pageIndex, sectionIndex }: { section: any, pageIndex?: number, sectionIndex?: number }) {
  const { type, title, description, content, data, insights, stat_tiles, table_data, chart_spec } = section
  const { setReportNavigation } = useArtifact()

  const handleChatToKevin = () => {
      if (pageIndex && sectionIndex) {
          setReportNavigation({
              pageNumber: pageIndex,
              sectionIndexes: [sectionIndex]
          })
      }

      const event = new CustomEvent('chat-focus-input', {
          detail: { text: `Regarding "${title?.replace(/<[^>]+>/g, '').trim() || 'this section'}": ` }
      })
      window.dispatchEvent(event)
  }

  return (
    <div className="space-y-4 group relative">
      <div className="flex items-start justify-between gap-4">
          <SectionTitle title={title} />
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

      {(type === "chart" || type === "CHART") && (chart_spec || data) && (
        <div className="h-[300px] w-full border rounded-lg p-4 bg-white shadow-sm">
          <ReportChart data={chart_spec || data} />
        </div>
      )}

      {(type === "table" || type === "TABLE") && (table_data || data) && (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <TableContent data={table_data || data} />
        </div>
      )}

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

export function ReportContent({ data }: { data: any }) {
  const { reportNavigation, setReportNavigation } = useArtifact()
  const [activePage, setActivePage] = React.useState(0)

  React.useEffect(() => {
      if (reportNavigation.pageNumber > 0 && reportNavigation.pageNumber - 1 !== activePage) {
          if (data?.pages && data.pages[reportNavigation.pageNumber - 1]) {
              setActivePage(reportNavigation.pageNumber - 1)
          }
      }
  }, [reportNavigation.pageNumber, data])

  const tabsRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const checkScrollability = React.useCallback(() => {
    if (tabsRef.current) {
      setCanScrollLeft(tabsRef.current.scrollLeft > 0)
      setCanScrollRight(tabsRef.current.scrollLeft < tabsRef.current.scrollWidth - tabsRef.current.clientWidth - 1)
    }
  }, [])

  React.useEffect(() => {
    checkScrollability()
    const tabsEl = tabsRef.current
    if (tabsEl) {
      tabsEl.addEventListener('scroll', checkScrollability)
    }
    window.addEventListener('resize', checkScrollability)
    return () => {
      tabsEl?.removeEventListener('scroll', checkScrollability)
      window.removeEventListener('resize', checkScrollability)
    }
  }, [checkScrollability, activePage])

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: direction === 'right' ? 150 : -150,
        behavior: 'smooth'
      })
    }
  }

  // Support for new Report structure with pages
  if (data?.pages && Array.isArray(data.pages)) {
    const handleTabChange = (index: number) => {
        setActivePage(index)
        setReportNavigation(prev => ({
            ...prev,
            pageNumber: index + 1,
            sectionIndexes: []
        }))
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
          <div className="flex items-center gap-1">
              {canScrollLeft && (
                  <button onClick={() => scrollTabs('left')} className="p-1 rounded hover:bg-gray-100 text-gray-500 flex-shrink-0">
                      <ChevronLeft size={16} />
                  </button>
              )}
              <div ref={tabsRef} className="flex overflow-x-auto gap-2 pb-1 no-scrollbar flex-1">
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
              {canScrollRight && (
                  <button onClick={() => scrollTabs('right')} className="p-1 rounded hover:bg-gray-100 text-gray-500 flex-shrink-0">
                      <ChevronRight size={16} />
                  </button>
              )}
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
