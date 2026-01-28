import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useEditProjectMemory, useProjectMemory } from "@/lib/hooks/use-projects"
import { Pencil, Lock, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ProjectMemorySectionProps {
  projectId: string
}

const formSchema = z.object({
  instruction: z.string().min(1).max(500),
})

export function ProjectMemorySection({ projectId }: ProjectMemorySectionProps) {
  const { data: memory, isLoading } = useProjectMemory(projectId)
  const editProjectMemory = useEditProjectMemory()
  const [isEditing, setIsEditing] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const { register, handleSubmit, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instruction: "",
    },
  })

  const sortedFacts = useMemo(() => {
    if (!memory?.facts) return []
    return [...memory.facts].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }, [memory?.facts])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    editProjectMemory.mutate({ projectId, instruction: values.instruction }, {
      onSuccess: (data) => {
        setIsEditing(false)
        reset({ instruction: "" })
        setLastMessage(data.message || data.explanation || null)
      },
      onError: () => {
        setLastMessage("Memory update failed. Please try again.")
      }
    })
  }

  const handleCancel = () => {
    reset({ instruction: "" })
    setIsEditing(false)
    setLastMessage(null)
  }

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
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
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
          No memory facts yet
        </div>
      ) : (
        <div className="space-y-2">
          {sortedFacts.map((fact) => (
            <div key={fact.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {formatCategory(fact.category)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round(fact.confidence * 100)}% confidence
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {fact.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <Textarea
            placeholder="Describe how to add, update, or remove a memory fact..."
            className="min-h-[120px] resize-y text-sm"
            {...register("instruction")}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={editProjectMemory.isPending}
            >
              Save
            </Button>
          </div>
        </form>
      ) : null}

      {lastMessage && (
        <p className="text-xs text-muted-foreground">{lastMessage}</p>
      )}
    </div>
  )
}
