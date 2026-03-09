export default function CampaignsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-80 rounded bg-muted animate-pulse mt-2" />
        </div>
        <div className="h-10 w-36 rounded-md bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="h-48 w-full rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}
