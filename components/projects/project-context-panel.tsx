import { ProjectMemorySection } from "./project-memory-section"
import { ProjectInstructionsSection } from "./project-instructions-section"
import { ProjectFilesSection } from "./project-files-section"

interface ProjectContextPanelProps {
  projectId: string
}

export function ProjectContextPanel({ projectId }: ProjectContextPanelProps) {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="flex flex-col divide-y">
        {/* Memory Section */}
        <div className="p-6">
          <ProjectMemorySection projectId={projectId} />
        </div>

        {/* Instructions Section */}
        <div className="p-6">
          <ProjectInstructionsSection projectId={projectId} />
        </div>

        {/* Files Section */}
        <div className="p-6">
          <ProjectFilesSection projectId={projectId} />
        </div>
      </div>
    </div>
  )
}
