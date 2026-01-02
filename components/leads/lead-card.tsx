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
}

export function LeadCard({ lead, isDragging = false }: LeadCardProps) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/dashboard/leads/${lead.id}`}>
        <Card
          className={`cursor-grab p-4 transition-all hover:shadow-md active:cursor-grabbing ${
            isActuallyDragging ? "opacity-50" : ""
          }`}
        >
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-semibold text-foreground">{lead.name}</h4>
              {lead.title && (
                <p className="text-xs text-muted-foreground">{lead.title}</p>
              )}
            </div>
            {/* Score Badge */}
            <div className="ml-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">{lead.score}</span>
            </div>
          </div>

          {/* Company & Contact */}
          <div className="mb-3 space-y-1.5">
            {lead.company && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Building2 className="h-3.5 w-3.5" />
                <span>{lead.company}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{lead.email}</span>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Phone className="h-3.5 w-3.5" />
                <span>{lead.phone}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {lead.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {lead.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer - Next Follow Up */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            {lead.nextFollowUpAt ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Follow up {formatDistanceToNow(lead.nextFollowUpAt)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>No follow-up scheduled</span>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </div>
  )
}
