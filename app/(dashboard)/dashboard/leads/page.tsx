"use client"

import { useState, useEffect } from "react"
import { PipelineKanban } from "@/components/leads/pipeline-kanban"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading"
import { Plus, Filter, Download } from "lucide-react"
import { getLeads, updateLeadStage } from "@/lib/mock/leads"
import type { Lead } from "@/types"

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (error) {
      console.error("Failed to load leads:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStageChange = async (leadId: string, newStage: Lead["stage"]) => {
    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, stage: newStage, updatedAt: new Date() } : lead
      )
    )

    try {
      await updateLeadStage(leadId, newStage)
    } catch (error) {
      console.error("Failed to update lead stage:", error)
      // Reload leads on error
      loadLeads()
    }
  }

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <LoadingState message="Loading leads pipeline..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track your leads through the sales pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-surface p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Leads</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{leads.length}</p>
        </div>
        <div className="rounded-lg bg-surface p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Qualified</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {leads.filter((l) => l.stage === "qualified").length}
          </p>
        </div>
        <div className="rounded-lg bg-surface p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">In Negotiation</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {leads.filter((l) => l.stage === "negotiation").length}
          </p>
        </div>
        <div className="rounded-lg bg-surface p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Avg. Score</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)}
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <PipelineKanban leads={leads} onLeadStageChange={handleStageChange} />
    </div>
  )
}
