import type { DashboardData, SourceData, StageBreakdown } from "@/lib/api/frost"
import { mockLeads } from "./leads"

/**
 * Generate mock dashboard data from mock leads
 */
export function generateMockDashboardData(period: string): DashboardData {
  const sources: Record<string, SourceData> = {}
  const stage_totals: Record<string, number> = {}
  
  // Initialize stages
  const stages = ['new', 'contacted', 'qualified', 'negotiation', 'won', 'lost']
  stages.forEach(stage => {
    stage_totals[stage] = 0
  })

  // Process leads
  mockLeads.forEach(lead => {
    // Count stages
    const stage = lead.stage
    stage_totals[stage] = (stage_totals[stage] || 0) + 1

    // Process source
    const source = lead.source || 'Direct'
    if (!sources[source]) {
      sources[source] = {
        total: 0,
        percentage: 0,
        stages: {}
      }
    }

    // Increment source totals
    sources[source].total += 1
    
    // Increment source stage counts
    if (!sources[source].stages[stage]) {
      sources[source].stages[stage] = { count: 0, percentage: 0 }
    }
    sources[source].stages[stage].count += 1
  })

  const total_leads = mockLeads.length

  // Calculate percentages
  Object.keys(sources).forEach(source => {
    const sourceData = sources[source]
    sourceData.percentage = Math.round((sourceData.total / total_leads) * 100)
    
    Object.keys(sourceData.stages).forEach(stage => {
      const stageData = sourceData.stages[stage]
      stageData.percentage = Math.round((stageData.count / sourceData.total) * 100)
    })
  })

  // Map mock leads to HubSpot-like structure expected by frontend
  const formattedLeads = mockLeads.map(lead => ({
    properties: {
      firstname: lead.name.split(' ')[0] || lead.name,
      lastname: lead.name.split(' ').slice(1).join(' ') || '',
      email: lead.email,
      company: lead.company,
      jobtitle: lead.title,
      hs_lead_status: lead.stage,
      hs_analytics_source: lead.source,
      createdate: lead.createdAt.toISOString(),
      lastmodifieddate: lead.updatedAt.toISOString(),
      lead_score: lead.score
    }
  }))

  return {
    date_range: {
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      days: period === 'current_week' ? 7 : 14
    },
    total_leads,
    stages,
    sources,
    stage_totals,
    leads: formattedLeads
  }
}
