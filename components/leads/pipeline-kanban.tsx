"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import type { Lead } from "@/types"
import { LeadCard } from "./lead-card"
import { PipelineColumn } from "./pipeline-column"

interface PipelineKanbanProps {
  leads: Lead[]
  onLeadStageChange: (leadId: string, newStage: Lead["stage"]) => void
}

const STAGES: Array<{ id: Lead["stage"]; title: string; count: number }> = [
  { id: "new", title: "New Leads", count: 0 },
  { id: "contacted", title: "Contacted", count: 0 },
  { id: "qualified", title: "Qualified", count: 0 },
  { id: "negotiation", title: "Negotiation", count: 0 },
  { id: "won", title: "Won", count: 0 },
  { id: "lost", title: "Lost", count: 0 },
]

export function PipelineKanban({ leads, onLeadStageChange }: PipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const groupedLeads = STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = leads.filter((lead) => lead.stage === stage.id)
      return acc
    },
    {} as Record<Lead["stage"], Lead[]>
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeLeadId = active.id as string
    const overStage = over.id as Lead["stage"]

    // Check if we dropped over a column
    if (STAGES.some((stage) => stage.id === overStage)) {
      onLeadStageChange(activeLeadId, overStage)
    }

    setActiveId(null)
  }

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = groupedLeads[stage.id]
          return (
            <PipelineColumn
              key={stage.id}
              id={stage.id}
              title={stage.title}
              count={stageLeads.length}
              leads={stageLeads}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="rotate-3 cursor-grabbing opacity-80">
            <LeadCard lead={activeLead} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
