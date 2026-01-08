/**
 * Frost API Client
 *
 * Client for HubSpot CRM integration via the Frost service.
 * Uses the proxy pattern similar to content generation - routes through /api/proxy
 * which handles Supabase authentication and injects KAWO credentials.
 */

import apiCall from './client'

// Type definitions matching backend response models
export interface DateRange {
  start: string
  end: string
  days: number
}

export interface StageBreakdown {
  count: number
  percentage: number
}

export interface SourceData {
  total: number
  percentage: number
  stages: Record<string, StageBreakdown>
}

export interface DashboardData {
  date_range: DateRange
  total_leads: number
  stages: string[]
  sources: Record<string, SourceData>
  stage_totals: Record<string, number>
  leads: any[]
}

/**
 * Frost/HubSpot Service
 *
 * All endpoints route through /api/proxy/frost/... which:
 * 1. Authenticates user via Supabase
 * 2. Fetches KAWO credentials from profiles table
 * 3. Forwards to backend at http://localhost:8000/frost/...
 * 4. Backend uses HUBSPOT_KEY from its environment
 */
export const frostService = {
  /**
   * Get dashboard data grouped by source and stage
   *
   * @param period 'current_week' or 'last_week'
   * @param limit Maximum number of leads to fetch (default: 100)
   *
   * Backend endpoint: GET /frost/dashboard
   */
  async getDashboard(period: string = 'current_week', limit: number = 100): Promise<DashboardData> {
    return apiCall<DashboardData>(`proxy/frost/dashboard?period=${period}&limit=${limit}`)
  },

  /**
   * Get new leads count (last + current week)
   *
   * Backend endpoint: GET /frost/leads/new-count
   */
  async getNewLeadsCount() {
    return apiCall<{ count: number; contacts: any[] }>('proxy/frost/leads/new-count')
  },

  /**
   * Search contacts with custom filters
   *
   * Backend endpoint: POST /frost/contacts/search
   */
  async searchContacts(filters: any[], properties?: string[]) {
    return apiCall('proxy/frost/contacts/search', {
      method: 'POST',
      body: JSON.stringify({
        filters,
        properties,
        limit: 100,
      }),
    })
  },

  /**
   * Health check for Frost service
   *
   * Backend endpoint: GET /frost/health
   */
  async healthCheck() {
    return apiCall('proxy/frost/health')
  },
}
