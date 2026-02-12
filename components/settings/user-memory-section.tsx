"use client"

import { useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { Brain, Lock } from "lucide-react"
import { useGlobalMemory } from "@/lib/hooks/use-projects"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

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
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Work context</h3>
              {(factsByCategory.work_context || []).map((fact) => (
                <div key={fact.id} className="rounded-md border p-3">
                  <p className="text-sm text-foreground leading-relaxed">{fact.content}</p>
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Personal context</h3>
              {(factsByCategory.personal_context || []).map((fact) => (
                <div key={fact.id} className="rounded-md border p-3">
                  <p className="text-sm text-foreground leading-relaxed">{fact.content}</p>
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Top of mind</h3>
              {(factsByCategory.top_of_mind || []).map((fact) => (
                <div key={fact.id} className="rounded-md border p-3">
                  <p className="text-sm text-foreground leading-relaxed">{fact.content}</p>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Brief history</h3>

              <div className="space-y-2">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Recent</Badge>
                {(factsByCategory.brief_history_recent || []).map((fact) => (
                  <div key={fact.id} className="rounded-md border p-3">
                    <p className="text-sm text-foreground leading-relaxed">{fact.content}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Earlier</Badge>
                {(factsByCategory.brief_history_earlier || []).map((fact) => (
                  <div key={fact.id} className="rounded-md border p-3">
                    <p className="text-sm text-foreground leading-relaxed">{fact.content}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Long-term</Badge>
                {(factsByCategory.brief_history_long_term || []).map((fact) => (
                  <div key={fact.id} className="rounded-md border p-3">
                    <p className="text-sm text-foreground leading-relaxed">{fact.content}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </Card>
  )
}
