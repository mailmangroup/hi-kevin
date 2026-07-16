export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 p-8 pt-6">
      <div>
        <div className="h-9 w-64 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-96 rounded bg-muted animate-pulse mt-2" />
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border bg-card p-6">
        <div className="h-6 w-40 rounded bg-muted animate-pulse mb-4" />
        <div className="h-64 w-full rounded bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-8">
          <div className="rounded-xl border bg-card p-6">
            <div className="h-48 w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="h-48 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="h-64 w-full rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}
