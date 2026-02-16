import { useQuery } from "@tanstack/react-query"
import { frostService, type DashboardData } from "@/lib/api/frost"
import { aiService } from "@/lib/api/client"

export function useDashboardData(period: string = 'current_week') {
  return useQuery({
    queryKey: ['dashboardData', period],
    queryFn: () => frostService.getDashboard(period),
    staleTime: 5 * 60 * 1000,
  })
}

export function useNewLeadsCount() {
  return useQuery({
    queryKey: ['newLeadsCount'],
    queryFn: () => frostService.getNewLeadsCount(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useConversations(limit = 20, skip = 0) {
  return useQuery({
    queryKey: ['conversations', limit, skip],
    queryFn: () => aiService.getConversations(limit, skip),
    staleTime: 30 * 1000, // 30 seconds — matches the old sidebar cache duration
  })
}
