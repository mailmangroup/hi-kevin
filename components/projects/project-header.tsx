import { ArrowLeft, MoreVertical, Settings, Trash } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Project } from "@/lib/api/client"
import { useDeleteProject } from "@/lib/hooks/use-projects"

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter()
  const deleteProject = useDeleteProject()

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProject.mutate(project.id, {
        onSuccess: () => {
          router.push("/projects")
        },
      })
    }
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <Link href="/projects">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{project.name}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
            <Trash className="mr-2 h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
