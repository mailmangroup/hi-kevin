export default function ContentLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-9 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-80 rounded bg-muted animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border bg-card p-6">
            <div className="h-6 w-40 rounded bg-muted animate-pulse mb-4" />
            <div className="h-64 w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="h-48 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="space-y-8">
          <div className="rounded-xl border bg-card p-6">
            <div className="h-48 w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 p-6">
            <div className="h-32 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
