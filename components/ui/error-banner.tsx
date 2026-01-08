import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ErrorBannerProps {
  title?: string
  message: string
  className?: string
  onClose?: () => void
}

export function ErrorBanner({ title = "Error", message, className, onClose }: ErrorBannerProps) {
  if (!message) return null

  return (
    <div className={cn("bg-destructive/15 text-destructive p-4 rounded-md flex items-start gap-3", className)}>
      <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
      <div className="flex-1">
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-sm opacity-90 mt-1">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-destructive/70 hover:text-destructive">
          <span className="sr-only">Dismiss</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
