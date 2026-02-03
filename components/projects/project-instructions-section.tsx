import { useState, useEffect, useRef } from "react"
import { useUpdateProject, useProject } from "@/lib/hooks/use-projects"
import { Pencil, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"

interface ProjectInstructionsSectionProps {
  projectId: string
}

export function ProjectInstructionsSection({ projectId }: ProjectInstructionsSectionProps) {
  const { data: project } = useProject(projectId)
  const updateProject = useUpdateProject()
  const [content, setContent] = useState("")
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (project?.instructions !== undefined) {
      setContent(project.instructions)
      if (contentRef.current && contentRef.current.innerText !== project.instructions) {
        contentRef.current.innerText = project.instructions
      }
    }
  }, [project])

  const handleBlur = () => {
    if (!contentRef.current) return
    const newContent = contentRef.current.innerText
    if (newContent !== project?.instructions) {
      updateProject.mutate({ id: projectId, data: { instructions: newContent } })
    }
  }

  const handleFocus = () => {
    if (contentRef.current) {
      contentRef.current.focus()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Instructions</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleFocus}
        >
          {updateProject.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="space-y-2 relative">
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          className={cn(
            "text-sm text-foreground leading-relaxed whitespace-pre-wrap min-h-[100px] p-2 -ml-2 rounded-md transition-colors",
            "focus:bg-accent/30 focus:outline-none focus:ring-1 focus:ring-ring",
            "empty:before:content-['Enter_custom_instructions...'] empty:before:text-muted-foreground"
          )}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
