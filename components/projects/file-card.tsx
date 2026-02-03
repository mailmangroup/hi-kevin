import { FileText, CheckSquare, Square, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatFileSize } from "@/lib/utils/file-helpers"
import { cn } from "@/lib/utils/cn"

interface FileCardProps {
  file: any
  isSelected: boolean
  onToggleSelect: () => void
  onPreview: () => void
  onDelete?: () => void
}

export function FileCard({ file, isSelected, onToggleSelect, onPreview, onDelete }: FileCardProps) {
  // Estimate lines from tokens (rough approximation: 1 line ≈ 12 tokens)
  const estimateLines = (tokenCount: number) => {
    return Math.round(tokenCount / 12)
  }

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

  const estimatedLines = estimateLines(file.token_count)

  return (
    <div
      className={cn(
        "relative p-4 border rounded-xl transition-all cursor-pointer flex flex-col h-[140px] justify-between group select-none",
        isSelected 
          ? "border-primary bg-primary/5 shadow-sm" 
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
      onClick={onPreview}
    >
      {/* Top Left: Delete Button (X) */}
      <div 
        className={cn(
          "absolute top-2 left-2 transition-opacity z-10",
          "opacity-0 group-hover:opacity-100"
        )}
      >
        <div
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.()
          }}
          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete file"
        >
          <X className="h-4 w-4" />
        </div>
      </div>

      {/* Top Right: Checkbox (Multi-select) */}
      <div 
        className={cn(
          "absolute top-2 right-2 transition-opacity z-10",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <div 
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect()
          }}
          className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {isSelected ? (
            <div className="text-primary rounded-sm">
              <CheckSquare className="h-5 w-5 fill-primary text-primary-foreground" />
            </div>
          ) : (
            <Square className="h-5 w-5 opacity-40 hover:opacity-100" />
          )}
        </div>
      </div>

      <div className="mt-4"> {/* Added margin-top to clear the top actions */}
        <h4 className="font-medium text-sm line-clamp-2 leading-tight mb-1.5" title={file.filename}>
          {file.filename}
        </h4>
        <p className="text-xs text-muted-foreground">
          {estimatedLines > 0 ? `${estimatedLines} lines` : formatFileSize(file.file_size)}
        </p>
      </div>

      <div className="flex items-end justify-between mt-auto">
        <Badge 
          variant="outline" 
          className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground border-muted-foreground/30 uppercase tracking-wider"
        >
          {getFileTypeBadge(file.filename)}
        </Badge>
        {/* Removed Checkbox from bottom right */}
      </div>
    </div>
  )
}
