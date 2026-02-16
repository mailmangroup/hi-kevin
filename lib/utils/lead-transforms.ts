import type { Lead } from '@/types'

interface HubSpotContactProperties {
  firstname?: string
  lastname?: string
  email?: string
  company?: string
  jobtitle?: string
  phone?: string
  hs_lead_status?: string
  hs_analytics_source?: string
  lead_source?: string
  hubspot_score?: string
  hubspotscore?: string
  createdate?: string
  lastmodifieddate?: string
}

interface HubSpotContact {
  id: string
  properties: HubSpotContactProperties
}

const HUBSPOT_STAGE_MAP: Record<string, Lead['stage']> = {
  new: 'new',
  open: 'new',
  'in progress': 'contacted',
  contacted: 'contacted',
  qualified: 'qualified',
  'open deal': 'negotiation',
  negotiation: 'negotiation',
  'unqualified': 'lost',
  won: 'won',
  lost: 'lost',
}

function mapHubSpotStage(status?: string): Lead['stage'] {
  if (!status) return 'new'
  return HUBSPOT_STAGE_MAP[status.toLowerCase()] || 'new'
}

/**
 * Transform a HubSpot contact into the app's Lead type.
 * Used by both the leads list and lead detail pages.
 */
export function transformHubSpotContact(contact: HubSpotContact): Lead {
  const props = contact.properties || {}
  return {
    id: contact.id,
    name: `${props.firstname || ''} ${props.lastname || ''}`.trim() || 'Unknown Name',
    title: props.jobtitle,
    company: props.company,
    email: props.email || '',
    phone: props.phone,

    stage: mapHubSpotStage(props.hs_lead_status),
    source: props.hs_analytics_source || props.lead_source || 'Unknown',
    tags: [],

    score: parseInt(props.hubspot_score || props.hubspotscore || '0'),
    fitScore: 0,
    behaviorScore: 0,
    scoreBreakdown: [],

    activities: [],
    lastContactedAt: props.lastmodifieddate ? new Date(props.lastmodifieddate) : undefined,

    createdAt: props.createdate ? new Date(props.createdate) : new Date(),
    updatedAt: props.lastmodifieddate ? new Date(props.lastmodifieddate) : new Date(),
  }
}
