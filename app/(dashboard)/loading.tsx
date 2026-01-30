import { LoadingState } from "@/components/ui/loading"

export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingState message="Loading..." />
    </div>
  )
}
