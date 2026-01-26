import { useState } from "react"
import { FileText, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProjectDocuments, useProject } from "@/lib/hooks/use-projects"
import { formatFileSize } from "@/lib/utils/file-helpers"
import { DocumentUploader } from "./document-uploader"

interface ProjectFilesSectionProps {
  projectId: string
}

export function ProjectFilesSection({ projectId }: ProjectFilesSectionProps) {
  const { data: project } = useProject(projectId)
  const { data: documents, isLoading } = useProjectDocuments(projectId)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Calculate capacity percentage (assuming 1M tokens as max capacity)
  const MAX_CAPACITY_TOKENS = 1_000_000
  const capacityPercentage = project ? Math.min((project.total_tokens / MAX_CAPACITY_TOKENS) * 100, 100) : 0

  const getFileTypeBadge = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const typeMap: Record<string, string> = {
      'txt': 'TEXT',
      'md': 'TEXT',
      'pdf': 'PDF',
      'docx': 'DOCX',
      'doc': 'DOC'
    }
    return typeMap[ext] || 'FILE'
  }

  // Estimate lines from tokens (rough approximation: 1 line ≈ 10-15 tokens)
  const estimateLines = (tokenCount: number) => {
    return Math.round(tokenCount / 12)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Files</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsUploadOpen(!isUploadOpen)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isUploadOpen && (
        <div className="mb-3 p-4 border rounded-lg bg-muted/20">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium">Upload Files</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsUploadOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DocumentUploader
            projectId={projectId}
            onUploadComplete={() => setIsUploadOpen(false)}
          />
        </div>
      )}

      {/* Capacity Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${capacityPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {capacityPercentage.toFixed(0)}% of project capacity used
        </p>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading files...</div>
      ) : !documents || documents.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4">
          No files uploaded yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {documents.map((doc) => {
            const estimatedLines = estimateLines(doc.token_count)
            return (
              <div
                key={doc.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors flex flex-col"
              >
                <p className="text-sm font-medium mb-1 line-clamp-2">{doc.filename}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {estimatedLines > 0 ? `${estimatedLines} lines` : formatFileSize(doc.file_size)}
                </p>
                <div className="mt-auto">
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    {getFileTypeBadge(doc.filename)}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
