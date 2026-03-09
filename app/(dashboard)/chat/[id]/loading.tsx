import { LoadingState } from "@/components/ui/loading"

export default function ChatDetailLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingState message="Loading conversation..." />
    </div>
  )
}
