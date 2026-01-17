"use client"

import { motion } from "framer-motion"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ReportProgressProps {
  progress: number // 0 to 100
  currentSection: string
  status: 'idle' | 'generating' | 'completed' | 'error'
  error?: string
  className?: string
}

export function ReportProgress({
  progress,
  currentSection,
  status,
  error,
  className
}: ReportProgressProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status === 'generating' && (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          )}
          {status === 'completed' && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="font-medium text-slate-700">
            {status === 'completed' ? 'Generation Complete' : 
             status === 'error' ? 'Generation Failed' : 
             currentSection || 'Initializing...'}
          </span>
        </div>
        <span className="text-slate-500">{Math.round(progress)}%</span>
      </div>

      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors",
            status === 'error' ? "bg-red-500" :
            status === 'completed' ? "bg-green-500" :
            "bg-indigo-600"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {status === 'error' && error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {status === 'generating' && (
        <p className="text-xs text-slate-500 text-center animate-pulse">
          Analyzing data and generating insights...
        </p>
      )}
    </div>
  )
}
