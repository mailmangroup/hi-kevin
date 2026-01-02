"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import "@/app/globals.css"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-4">
          <h2 className="text-2xl font-bold tracking-tight">Critical System Error</h2>
          <p className="text-muted-foreground max-w-[500px]">
            A critical error occurred. Please try refreshing the page.
          </p>
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload Application
          </Button>
        </div>
      </body>
    </html>
  )
}
