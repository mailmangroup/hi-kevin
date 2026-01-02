/**
 * Mock Data Services
 *
 * Central export file for all mock data services.
 * Use these functions in components during development.
 */

// Dashboard
export { getDashboardData, mockDashboardData } from './dashboard'

// Content
export {
  getContentItems,
  getContentItem,
  generateContentDraft,
  checkCompliance,
  mockContentItems,
} from './content'

// Leads
export {
  getLeads,
  getLead,
  updateLeadStage,
  generateFollowUp,
  mockLeads,
} from './leads'

// Brand Safety
export {
  getComplianceAlerts,
  getSensitiveDates,
  getBrandGuidelines,
  checkBrandGuidelines,
  updateAlertStatus,
  mockComplianceAlerts,
  mockSensitiveDates,
  mockBrandGuidelines,
} from './brand-safety'

// Re-export types for convenience
export type * from '@/types'
