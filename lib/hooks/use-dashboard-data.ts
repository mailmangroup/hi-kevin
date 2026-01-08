import { useQuery } from "@tanstack/react-query"
import { frostService, type DashboardData } from "@/lib/api/frost"

export function useDashboardData(period: string = 'current_week') {
  return useQuery({
    queryKey: ['dashboardData', period],
    queryFn: () => frostService.getDashboard(period),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })
}

export function useNewLeadsCount() {
  return useQuery({
    queryKey: ['newLeadsCount'],
    queryFn: () => frostService.getNewLeadsCount(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })
}
