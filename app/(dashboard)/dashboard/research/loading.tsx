import { LoadingState } from "@/components/ui/loading"

export default function ResearchLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingState message="Loading research..." />
    </div>
  )
}
