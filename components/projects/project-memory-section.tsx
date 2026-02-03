import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { useProjectMemory } from "@/lib/hooks/use-projects"
import { Lock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ProjectMemorySectionProps {
  projectId: string
}

export function ProjectMemorySection({ projectId }: ProjectMemorySectionProps) {
  const { data: memory, isLoading } = useProjectMemory(projectId)

  const sortedFacts = useMemo(() => {
    if (!memory?.facts) return []
    return [...memory.facts].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }, [memory?.facts])

  const formatCategory = (category: string) => {
    return category.replace(/_/g, " ")
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Memory</h3>
          <Badge variant="secondary" className="text-xs gap-1 font-normal">
            <Lock className="h-3 w-3" />
            Only you
          </Badge>
        </div>
      </div>

      {memory?.last_extraction_at && (
        <p className="text-xs text-muted-foreground">
          Last extracted {formatDistanceToNow(new Date(memory.last_extraction_at), { addSuffix: true })}
        </p>
      )}

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading memory...</div>
      ) : sortedFacts.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          No memory yet
        </div>
      ) : (
        <div className="space-y-2">
          {sortedFacts.map((fact) => (
            <div key={fact.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {formatCategory(fact.category)}
                </Badge>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {fact.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
