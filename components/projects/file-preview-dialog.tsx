import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useQuery } from "@tanstack/react-query"
import { aiService } from "@/lib/api/client"
import { Loader2 } from "lucide-react"

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string | null
  filename?: string
}

export function FilePreviewDialog({ open, onOpenChange, documentId, filename }: FilePreviewDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentId ? aiService.getDocumentStandalone(documentId) : null,
    enabled: !!documentId && open,
  })

  const document = data?.document

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{filename || document?.filename || "File Preview"}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto border rounded-md p-4 bg-muted/10 font-mono text-sm whitespace-pre-wrap">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : document ? (
            document.document_summary || document.content || "No preview content available."
          ) : (
            <div className="text-muted-foreground text-center pt-10">
              Could not load document content.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
