export default function DeepAgentChatDetailLoading() {
  return (
    <div className="flex h-full min-h-0 bg-transparent">
      <div className="flex flex-col h-full min-h-0 flex-1">
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <span className="text-muted-foreground/40">/</span>
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
        </div>

        {/* Messages skeleton */}
        <div className="flex-1 min-h-0 overflow-hidden p-4 md:p-8 pb-6">
          <div className="mx-auto w-full max-w-3xl space-y-6">
            <div className="flex justify-end">
              <div className="h-10 w-64 rounded-2xl bg-muted animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                <div className="h-4 w-4/6 rounded bg-muted animate-pulse" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="h-10 w-80 rounded-2xl bg-muted animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Input area skeleton */}
        <div className="border-t border-border/50 p-4">
          <div className="mx-auto w-full max-w-3xl">
            <div className="h-12 w-full rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
