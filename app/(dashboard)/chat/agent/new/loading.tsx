export default function NewAgentChatLoading() {
  return (
    <div className="flex h-full min-h-0 bg-transparent">
      <div className="flex flex-col h-full min-h-0 flex-1">
        {/* Header skeleton */}
        <div className="flex items-center border-b border-border/50 px-6 py-3">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>

        {/* Empty chat center area */}
        <div className="flex-1 min-h-0" />

        {/* Input area skeleton with "How can I help you?" */}
        <div className="flex-shrink-0 p-4">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-8 text-center">
              <div className="h-8 w-64 rounded bg-muted animate-pulse mx-auto" />
            </div>
            <div className="h-12 w-full rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
