import { LoadingState } from "@/components/ui/loading"

export default function BrandSafetyLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingState message="Loading brand safety..." />
    </div>
  )
}
