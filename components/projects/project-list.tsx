"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useProjects } from "@/lib/hooks/use-projects"
import { ProjectCard } from "./project-card"
import { ProjectCreateDialog } from "./project-create-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export function ProjectList() {
  const [search, setSearch] = useState("")
  const { data, isLoading } = useProjects()

  const filteredProjects = data?.projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ProjectCreateDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      ) : filteredProjects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-semibold">No projects found</h3>
          <p className="text-muted-foreground">
            Create a new project to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
