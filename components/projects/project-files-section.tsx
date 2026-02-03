import { useState } from "react"
import { Plus, X, Trash, Trash2, MinusSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProjectDocuments, useProject } from "@/lib/hooks/use-projects"
import { DocumentUploader } from "./document-uploader"
import { FileCard } from "./file-card"
import { FilePreviewDialog } from "./file-preview-dialog"
import { aiService } from "@/lib/api/client"
import { useQueryClient } from "@tanstack/react-query"

interface ProjectFilesSectionProps {
  projectId: string
}

export function ProjectFilesSection({ projectId }: ProjectFilesSectionProps) {
  const { data: project } = useProject(projectId)
  const { data: documents, isLoading } = useProjectDocuments(projectId)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  
  // Selection & Preview State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewFileId, setPreviewFileId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  // Calculate capacity percentage (assuming 1M tokens as max capacity)
  const MAX_CAPACITY_TOKENS = 1_000_000
  const capacityPercentage = project ? Math.min((project.total_tokens / MAX_CAPACITY_TOKENS) * 100, 100) : 0

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (documents) {
      setSelectedIds(new Set(documents.map(d => d.id)))
    }
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} files?`)) return

    setIsDeleting(true)
    try {
      // Execute deletions in parallel
      await Promise.all(
        Array.from(selectedIds).map(id => aiService.deleteProjectDocument(projectId, id))
      )
      
      // Clear selection and refresh
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    } catch (error) {
      console.error("Failed to delete files:", error)
      alert("Failed to delete some files. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteSingle = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return
    setIsDeleting(true)
    try {
      await aiService.deleteProjectDocument(projectId, documentId)
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    } catch (error) {
      console.error("Failed to delete file:", error)
      alert("Failed to delete file.")
    } finally {
      setIsDeleting(false)
    }
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
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{capacityPercentage < 1 && capacityPercentage > 0 ? '<1' : capacityPercentage.toFixed(0)}% of project capacity used</span>
          <span>{project?.total_tokens?.toLocaleString() ?? 0} tokens</span>
        </div>
      </div>

      {/* Bulk Selection Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between py-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={deselectAll}
              title="Clear selection"
            >
              <MinusSquare className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {selectedIds.size} selected
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            title="Delete selected"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading files...</div>
      ) : !documents || documents.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4">
          No files uploaded yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {documents.map((doc) => (
            <FileCard
              key={doc.id}
              file={doc}
              isSelected={selectedIds.has(doc.id)}
              onToggleSelect={() => toggleSelect(doc.id)}
              onPreview={() => setPreviewFileId(doc.id)}
              onDelete={() => handleDeleteSingle(doc.id)}
            />
          ))}
        </div>
      )}

      <FilePreviewDialog 
        open={!!previewFileId} 
        onOpenChange={(open) => !open && setPreviewFileId(null)}
        documentId={previewFileId}
        filename={documents?.find(d => d.id === previewFileId)?.filename}
      />
    </div>
  )
}
