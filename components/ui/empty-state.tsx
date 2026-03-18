"use client"

import { Button } from "@/components/ui/button"
import { LucideIcon, Ghost } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Ghost,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm min-h-[300px]",
      className
    )}>
      <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-[400px] mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick} className="gap-2">
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
