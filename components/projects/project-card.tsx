import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Calendar, FileText, Database } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Project } from "@/lib/api/client"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl truncate pr-2">{project.name}</CardTitle>
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {project.description || "No description provided."}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-start border-t pt-4 text-xs text-muted-foreground bg-muted/20">
          <div className="flex w-full justify-between">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{project.document_count} {project.document_count === 1 ? 'doc' : 'docs'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>
                {project.total_tokens > 0 && project.total_tokens < 1000 
                  ? '<1k tokens' 
                  : `${Math.round(project.total_tokens / 1000)}k tokens`
                }
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 w-full">
            <Calendar className="w-3 h-3" />
            <span>Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
