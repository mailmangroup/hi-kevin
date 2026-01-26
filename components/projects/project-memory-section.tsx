import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useUpdateProject, useProject } from "@/lib/hooks/use-projects"
import { Pencil, Lock, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ProjectMemorySectionProps {
  projectId: string
}

const formSchema = z.object({
  description: z.string().optional(),
})

export function ProjectMemorySection({ projectId }: ProjectMemorySectionProps) {
  const { data: project } = useProject(projectId)
  const updateProject = useUpdateProject()
  const [isEditing, setIsEditing] = useState(false)

  const { register, handleSubmit, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: project?.description || "",
    },
  })

  useEffect(() => {
    if (project) {
      reset({ description: project.description || "" })
    }
  }, [project, reset])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateProject.mutate({ id: projectId, data: { description: values.description } }, {
      onSuccess: () => {
        setIsEditing(false)
      }
    })
  }

  const handleCancel = () => {
    reset({ description: project?.description || "" })
    setIsEditing(false)
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

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <Textarea
            placeholder="Describe the project purpose and context..."
            className="min-h-[120px] resize-y text-sm"
            {...register("description")}
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
          <p className="text-sm text-muted-foreground">Purpose & context</p>
          <p className="text-sm text-foreground leading-relaxed line-clamp-3">
            {project?.description || "No description provided yet."}
          </p>
          {project?.updated_at && (
            <p className="text-xs text-muted-foreground">
              Last updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
