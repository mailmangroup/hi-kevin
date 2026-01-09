"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { Lead } from "@/types"
import { LeadCard } from "./lead-card"

interface PipelineColumnProps {
  id: string
  title: string
  count: number
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}

export function PipelineColumn({ id, title, count, leads, onLeadClick }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex min-w-[280px] flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between rounded-lg bg-surface px-4 py-3 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {count}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex min-h-[500px] flex-1 flex-col gap-3 rounded-lg border-2 border-dashed p-3 transition-colors ${
          isOver
            ? "border-primary bg-primary/5"
            : "border-border bg-background"
        }`}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">No leads in this stage</p>
          </div>
        )}
      </div>
    </div>
  )
}
