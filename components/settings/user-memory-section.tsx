"use client"

import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Brain, Lock, Trash2 } from "lucide-react"
import { useGlobalMemory, useClearGlobalMemoryCategory } from "@/lib/hooks/use-projects"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

const CATEGORY_LABELS: Record<string, string> = {
  work_context: "Work context",
  personal_context: "Personal context",
  top_of_mind: "Top of mind",
  brief_history_recent: "Brief history — Recent",
  brief_history_earlier: "Brief history — Earlier",
  brief_history_long_term: "Brief history — Long-term",
}

function CategorySection({
  category,
  label,
  facts,
  badge,
}: {
  category: string
  label: string
  facts: { id: string; content: string }[]
  badge?: string
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutate: clearCategory, isPending } = useClearGlobalMemoryCategory()

  if (facts.length === 0) return null

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        {badge ? (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{badge}</Badge>
        ) : (
          <h3 className="text-sm font-semibold">{label}</h3>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {facts.map((fact) => (
        <div key={fact.id} className="rounded-md border p-3">
          <p className="text-sm text-foreground leading-relaxed">{fact.content}</p>
        </div>
      ))}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Clear ${CATEGORY_LABELS[category] ?? label}?`}
        description="This will permanently delete all facts in this category. This cannot be undone."
        confirmText="Clear"
        variant="destructive"
        onConfirm={() => clearCategory(category)}
      />
    </section>
  )
}

export function UserMemorySection() {
  const { data: memory, isLoading, isError, error } = useGlobalMemory()

  const sortedFacts = useMemo(() => {
    if (!memory?.facts) return []
    return [...memory.facts].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }, [memory?.facts])
  const factsByCategory = useMemo(() => {
    return sortedFacts.reduce<Record<string, typeof sortedFacts>>((acc, fact) => {
      acc[fact.category] = [...(acc[fact.category] || []), fact]
      return acc
    }, {})
  }, [sortedFacts])

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Your Memory
          </h2>
          <Badge variant="secondary" className="text-xs gap-1 font-normal">
            <Lock className="h-3 w-3" />
            Only you
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Kevin stores useful profile context from your conversations to personalize responses.
        </p>

        {memory?.last_extraction_at && (
          <p className="text-xs text-muted-foreground">
            Last extracted {formatDistanceToNow(new Date(memory.last_extraction_at), { addSuffix: true })}
          </p>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading memory...</div>
        ) : isError ? (
          <div className="text-sm text-destructive">
            {(error as Error)?.message || "Failed to load memory."}
          </div>
        ) : sortedFacts.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
            No memory yet
          </div>
        ) : (
          <div className="space-y-5">
            <CategorySection
              category="work_context"
              label="Work context"
              facts={factsByCategory.work_context || []}
            />
            <CategorySection
              category="personal_context"
              label="Personal context"
              facts={factsByCategory.personal_context || []}
            />
            <CategorySection
              category="top_of_mind"
              label="Top of mind"
              facts={factsByCategory.top_of_mind || []}
            />

            {(factsByCategory.brief_history_recent?.length > 0 ||
              factsByCategory.brief_history_earlier?.length > 0 ||
              factsByCategory.brief_history_long_term?.length > 0) && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Brief history</h3>
                <CategorySection
                  category="brief_history_recent"
                  label="Brief history — Recent"
                  badge="Recent"
                  facts={factsByCategory.brief_history_recent || []}
                />
                <CategorySection
                  category="brief_history_earlier"
                  label="Brief history — Earlier"
                  badge="Earlier"
                  facts={factsByCategory.brief_history_earlier || []}
                />
                <CategorySection
                  category="brief_history_long_term"
                  label="Brief history — Long-term"
                  badge="Long-term"
                  facts={factsByCategory.brief_history_long_term || []}
                />
              </section>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
