import { useState } from "react"
import { useProject } from "@/lib/hooks/use-projects"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import { ProjectInstructionsEditDialog } from "./project-instructions-edit-dialog"

interface ProjectInstructionsSectionProps {
  projectId: string
}

export function ProjectInstructionsSection({ projectId }: ProjectInstructionsSectionProps) {
  const { data: project } = useProject(projectId)
  const [isEditOpen, setIsEditOpen] = useState(false)

  if (!project) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Instructions</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <div className={cn(
        "text-sm text-foreground leading-relaxed whitespace-pre-wrap min-h-[100px] p-2 -ml-2 rounded-md",
        !project.instructions && "text-muted-foreground italic"
      )}>
        {project.instructions || "No custom instructions provided."}
      </div>

      <ProjectInstructionsEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        project={project}
      />
    </div>
  )
}
