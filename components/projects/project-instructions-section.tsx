import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateProject, useProject } from "@/lib/hooks/use-projects"
import { Pencil, X } from "lucide-react"

interface ProjectInstructionsSectionProps {
  projectId: string
}

const formSchema = z.object({
  instructions: z.string().optional(),
})

export function ProjectInstructionsSection({ projectId }: ProjectInstructionsSectionProps) {
  const { data: project } = useProject(projectId)
  const updateProject = useUpdateProject()
  const [isEditing, setIsEditing] = useState(false)

  const { register, handleSubmit, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instructions: project?.instructions || "",
    },
  })

  useEffect(() => {
    if (project) {
      reset({ instructions: project.instructions || "" })
    }
  }, [project, reset])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateProject.mutate({ id: projectId, data: { instructions: values.instructions } }, {
      onSuccess: () => {
        setIsEditing(false)
      }
    })
  }

  const handleCancel = () => {
    reset({ instructions: project?.instructions || "" })
    setIsEditing(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Instructions</h3>
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

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <Textarea
            placeholder="Enter custom instructions for how the AI should behave in this project..."
            className="min-h-[200px] resize-y text-sm"
            {...register("instructions")}
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
              disabled={updateProject.isPending}
            >
              Save
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
            {project?.instructions || "No custom instructions provided yet."}
          </p>
        </div>
      )}
    </div>
  )
}
