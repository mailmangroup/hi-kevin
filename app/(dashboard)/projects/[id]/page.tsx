"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { useProject } from "@/lib/hooks/use-projects"
import { ProjectSidebar } from "@/components/projects/project-sidebar"
import { ProjectContextPanel } from "@/components/projects/project-context-panel"
import { ProjectEditDialog } from "@/components/projects/project-edit-dialog"
import { ChatInput } from "@/components/dashboard/chat-input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDeleteProject } from "@/lib/hooks/use-projects"
import { useConfirm } from "@/components/providers/confirm-provider"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { data: project, isLoading } = useProject(projectId)
  const deleteProject = useDeleteProject()
  const { confirm } = useConfirm()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleDelete = async () => {
    if (await confirm({
      title: "Delete Project",
      description: "Are you sure you want to delete this project? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    })) {
      deleteProject.mutate(projectId, {
        onSuccess: () => {
          router.push("/projects")
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Left Column Skeleton */}
        <div className="w-[600px] flex flex-col border-r p-6">
          <Skeleton className="h-4 w-24 mb-6" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-32 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        {/* Right Column Skeleton */}
        <div className="flex-1 p-6">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="text-muted-foreground">The project you are looking for does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Left Column: Project Intro, Chat Input, Chat History */}
      <div className="w-[600px] flex flex-col border-r">
        {/* Project Intro Section */}
        <div className="p-6 pb-0">
          {/* Back Link */}
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            All projects
          </Link>

          {/* Project Title Row */}
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <ProjectEditDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            project={project}
          />

          {/* Project Description */}
          {project.description && (
            <p className="text-muted-foreground mb-6">{project.description}</p>
          )}
        </div>

        {/* Chat Input Section */}
        <div className="px-6 pb-4">
          <ChatInput
            projectId={projectId}
            projectName={project.name}
            projectDescription={project.description}
            hideActions
          />
        </div>

        {/* Chat History Section */}
        <div className="flex-1 overflow-y-auto border-t">
          <ProjectSidebar projectId={projectId} />
        </div>
      </div>

      {/* Right Column: Memory, Instructions, Files */}
      <div className="flex-1 overflow-y-auto">
        <ProjectContextPanel projectId={projectId} />
      </div>
    </div>
  )
}
