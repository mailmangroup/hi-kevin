"use client"

import { useState, useEffect, Fragment, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading"
import { Download, Calendar, ChevronDown, ChevronRight, UserPlus } from "lucide-react"
import { 
  DndContext, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  KeyboardSensor,
  closestCorners
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { type DashboardData } from "@/lib/api/frost"
import { useDashboardData, useNewLeadsCount } from "@/lib/hooks/use-dashboard-data"
import { PipelineColumn } from "@/components/leads/pipeline-column"
import { LeadDetailDialog } from "@/components/leads/lead-detail-dialog"
import type { Lead } from "@/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TIME_PERIODS = [
  { value: "current_week", label: "Current Week" },
  { value: "last_week", label: "Last Week" },
]

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
}

export default function LeadsPage() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [selectedPeriod, setSelectedPeriod] = useState("current_week")
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({})
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { 
    data: dashboardData, 
    isLoading: loading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useDashboardData(selectedPeriod)

  const { data: newLeadsCountData } = useNewLeadsCount()
  const newLeadsCount = newLeadsCountData?.count ?? null

  const error = dashboardError ? (dashboardError as Error).message || "Failed to load dashboard data" : null

  useEffect(() => {
    if (dashboardData && dashboardData.sources) {
      // Expand all sources by default
      const initialExpanded: Record<string, boolean> = {}
      Object.keys(dashboardData.sources).forEach(source => {
        initialExpanded[source] = true
      })
      setExpandedSources(initialExpanded)
    }
  }, [dashboardData])

  const toggleSource = (source: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }))
  }

  const loadDashboard = () => {
    refetchDashboard()
  }

  const leads: Lead[] = useMemo(() => {
    return dashboardData?.leads?.map((lead: any) => {
      const props = lead.properties || {}
      return {
        id: lead.id,
        name: `${props.firstname || ''} ${props.lastname || ''}`.trim() || 'Unknown Name',
        title: props.jobtitle,
        company: props.company,
        email: props.email,
        phone: props.phone,
        stage: (props.hs_lead_status?.toLowerCase() || 'new') as Lead['stage'],
        source: props.hs_analytics_source || props.lead_source || 'Unknown',
        tags: [], // Mock or extract if available
        score: parseInt(props.hubspot_score || '0'), 
        createdAt: new Date(props.createdate || Date.now()),
        updatedAt: new Date(props.lastmodifieddate || Date.now()),
        // Defaults
        fitScore: 0,
        behaviorScore: 0,
        scoreBreakdown: [],
        activities: [],
      }
    }) || []
  }, [dashboardData])

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDialogOpen(true)
  }

  const downloadCSV = (type: 'summary' | 'details') => {
    if (!dashboardData) return

    let csvContent = "data:text/csv;charset=utf-8,"

    if (type === 'summary') {
      // Header
      csvContent += "Source,Stage,Count,Percentage\n"
      
      // Rows
      Object.entries(dashboardData.sources).forEach(([source, data]) => {
        // Source Total Row
        csvContent += `"${source} (Total)",,${data.total},${data.percentage}%\n`
        
        // Stage Rows
        Object.entries(data.stages).forEach(([stage, stageData]) => {
          if (stageData.count > 0) {
            csvContent += `"${source}","${STAGE_LABELS[stage] || stage}",${stageData.count},${stageData.percentage}%\n`
          }
        })
      })
      
      // Grand Total
      csvContent += `GRAND TOTAL,,${dashboardData.total_leads},100%\n`
      
    } else {
      // Header
      csvContent += "First Name,Last Name,Email,Company,Title,Status,Source,Date\n"
      
      // Rows
      dashboardData.leads.forEach((lead: any) => {
        const p = lead.properties || {}
        const date = p.createdate ? new Date(p.createdate).toLocaleDateString() : ''
        const row = [
          p.firstname || '',
          p.lastname || '',
          p.email || '',
          p.company || '',
          p.jobtitle || '',
          p.hs_lead_status || '',
          p.hs_analytics_source || p.lead_source || '',
          date
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        
        csvContent += row + "\n"
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `leads_${type}_${selectedPeriod}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <LoadingState message="Loading leads dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={loadDashboard}>Retry</Button>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track leads grouped by source and pipeline stage
          </p>
        </div>
        <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[220px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-xl bg-card p-6 shadow-sm border border-border">
          <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {dashboardData.total_leads}
            </span>
            <span className="text-sm text-muted-foreground">
              in selected period
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">New Leads</p>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {newLeadsCount !== null ? newLeadsCount : '-'}
            </span>
            <span className="text-xs text-muted-foreground">
              Last + Current Week
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm border border-border md:col-span-2">
           <div className="flex items-center justify-between h-full">
              <div className="space-y-1">
                 <p className="text-sm font-medium text-muted-foreground">Date Range</p>
                 <p className="text-xl font-semibold">
                    {new Date(dashboardData.date_range.start).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    {' — '}
                    {new Date(dashboardData.date_range.end).toLocaleDateString(undefined, { dateStyle: 'long' })}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Aggregated View (Nested Table) */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lead Sources Breakdown</h2>
          <Button variant="outline" size="sm" onClick={() => downloadCSV('summary')} title="Export Summary">
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground w-[50%]">Row Labels</th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Percentage</th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(dashboardData.sources).map(([source, data]) => {
                const isExpanded = expandedSources[source];
                return (
                  <Fragment key={source}>
                    {/* Group Header Row */}
                    <tr 
                      className="bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => toggleSource(source)}
                    >
                      <td className="px-6 py-3 font-medium flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        {source}
                      </td>
                      <td className="px-6 py-3 text-right font-medium">{data.percentage}%</td>
                      <td className="px-6 py-3 text-right font-bold">{data.total}</td>
                    </tr>
                    
                    {/* Expanded Detail Rows */}
                    {isExpanded && Object.entries(data.stages).map(([stage, stageData]) => {
                      if (stageData.count === 0) return null; // Hide empty stages
                      return (
                        <tr key={`${source}-${stage}`} className="hover:bg-muted/10">
                          <td className="px-6 py-2 pl-12 text-muted-foreground">
                            {STAGE_LABELS[stage] || stage}
                          </td>
                          <td className="px-6 py-2 text-right text-muted-foreground">
                            {stageData.percentage}%
                          </td>
                          <td className="px-6 py-2 text-right text-foreground">
                            {stageData.count}
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              })}
              
              {/* Grand Total Row */}
              <tr className="bg-muted/50 font-bold border-t-2 border-border">
                <td className="px-6 py-4">Grand Total</td>
                <td className="px-6 py-4 text-right">100%</td>
                <td className="px-6 py-4 text-right">{dashboardData.total_leads}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Board */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Details Board</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCSV('details')} title="Export Details">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
           <DndContext sensors={sensors} collisionDetection={closestCorners}>
              <div className="flex gap-4 min-w-max">
                 {Object.keys(dashboardData?.sources || {}).map(source => {
                    const sourceLeads = leads.filter(l => l.source === source)
                    return (
                      <PipelineColumn 
                        key={source}
                        id={source}
                        title={source}
                        count={sourceLeads.length}
                        leads={sourceLeads}
                        onLeadClick={handleLeadClick}
                      />
                    )
                 })}
              </div>
           </DndContext>
        </div>
      </div>
      
      <LeadDetailDialog 
        lead={selectedLead} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  )
}
