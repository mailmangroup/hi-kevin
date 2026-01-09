"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import type { Lead } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, Clock, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils/date"

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
  onClick?: (lead: Lead) => void
}

export function LeadCard({ lead, isDragging = false, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isActuallyDragging = isDragging || isSortableDragging

  const CardContent = (
    <Card
      className={`cursor-grab p-2 transition-all hover:shadow-md active:cursor-grabbing ${
        isActuallyDragging ? "opacity-50" : ""
      }`}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <h4 className="mb-0.5 text-xs font-semibold text-foreground truncate">{lead.name}</h4>
          {lead.title && (
            <p className="text-[10px] text-muted-foreground truncate">{lead.title}</p>
          )}
        </div>
        {/* Score Badge */}
        <div className="ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <span className="text-[10px] font-bold text-primary">{lead.score}</span>
        </div>
      </div>

      {/* Company & Contact */}
      <div className="mb-2 space-y-1">
        {lead.company && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email}</span>
        </div>
      </div>

      {/* Footer - Next Follow Up */}
      <div className="flex items-center justify-between border-t border-border pt-2">
        {lead.nextFollowUpAt ? (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(lead.nextFollowUpAt)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>No schedule</span>
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {onClick ? (
        <div onClick={() => onClick(lead)} role="button" tabIndex={0} className="outline-none">
          {CardContent}
        </div>
      ) : (
        <Link href={`/dashboard/leads/${lead.id}`}>
          {CardContent}
        </Link>
      )}
    </div>
  )
}
