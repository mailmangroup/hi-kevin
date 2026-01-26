/**
 * Frost API Client
 *
 * Client for HubSpot CRM integration via the Frost service.
 * Makes direct calls to the KAWO backend API, bypassing Vercel serverless functions
 * to avoid timeout limitations.
 */

import { directApiCall } from './client'

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
 * All endpoints call the KAWO backend API directly with:
 * 1. KAWO credentials from Supabase profiles table (or env vars in dev)
 * 2. Proper Authorization and X-KAWO headers
 * 3. Backend uses HUBSPOT_KEY from its environment to access HubSpot
 */
export const frostService = {
  /**
   * Get dashboard data grouped by source and stage
   *
   * @param period 'current_week' or 'last_week'
   *
   * Backend endpoint: GET /frost/dashboard
   */
  async getDashboard(period: string = 'current_week'): Promise<DashboardData> {
    return directApiCall<DashboardData>(`frost/dashboard?period=${period}`)
  },

  /**
   * Get new leads count (last + current week)
   *
   * Backend endpoint: GET /frost/leads/new-count
   */
  async getNewLeadsCount() {
    return directApiCall<{ count: number; contacts: any[] }>('frost/leads/new-count')
  },

  /**
   * Search contacts with custom filters
   *
   * Backend endpoint: POST /frost/contacts/search
   */
  async searchContacts(filters: any[], properties?: string[]) {
    return directApiCall('frost/contacts/search', {
      method: 'POST',
      body: JSON.stringify({
        filters,
        properties,
        limit: 100,
      }),
    })
  },

  /**
   * Get a single contact by ID
   */
  async getContact(contactId: string) {
    const filters = [
      {
        filters: [
          {
            propertyName: 'hs_object_id',
            operator: 'EQ',
            value: contactId
          }
        ]
      }
    ]
    const result: any = await this.searchContacts(filters)
    return result.results?.[0] || null
  },

  /**
   * Health check for Frost service
   *
   * Backend endpoint: GET /frost/health
   */
  async healthCheck() {
    return directApiCall('frost/health')
  },
}
