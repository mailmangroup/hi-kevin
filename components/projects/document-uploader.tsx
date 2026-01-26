import { useState, useRef } from "react"
import { Upload, X, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { aiService } from "@/lib/api/client"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils/cn"

interface DocumentUploaderProps {
  projectId: string
  onUploadComplete?: () => void
}

export function DocumentUploader({ projectId, onUploadComplete }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    setUploading(true)
    setProgress(0)
    
    try {
      const totalFiles = files.length
      let completed = 0

      for (const file of files) {
        // 1. Get presigned URL
        const { upload_url, document_id } = await aiService.signProjectDocumentUpload(
          projectId, 
          file.name, 
          file.type || 'application/octet-stream'
        )

        // 2. Upload to OSS
        await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream'
          }
        })

        // 3. Trigger ingestion
        await aiService.ingestProjectDocument(projectId, document_id)

        completed++
        setProgress((completed / totalFiles) * 100)
      }

      setFiles([])
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      onUploadComplete?.()
    } catch (error) {
      console.error("Upload failed:", error)
      // Show error toast
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop files here, or click to select
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOCX, TXT, MD supported
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between gap-2 p-2 border rounded-md text-sm">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              {!uploading && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          
          {uploading && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">Uploading...</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
             <Button variant="outline" size="sm" onClick={() => setFiles([])} disabled={uploading}>
              Clear
            </Button>
            <Button size="sm" onClick={uploadFiles} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload {files.length} Files
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
