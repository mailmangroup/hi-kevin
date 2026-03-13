
"use client"

import { useCallback, useState } from "react"
import { Upload, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { processFile, type ProcessedComment } from "@/lib/utils/file-processor"

interface FileUploaderProps {
  onDataProcessed: (data: ProcessedComment[], filename: string) => void
  isProcessing?: boolean
}

export function FileUploader({ onDataProcessed, isProcessing }: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setIsReading(true)
    try {
      const comments = await processFile(file)
      if (comments.length === 0) {
        setError("No valid comments found in file. Please check column names.")
      } else {
        onDataProcessed(comments, file.name)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to process file")
    } finally {
      setIsReading(false)
    }
  }, [onDataProcessed])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer bg-white/50 backdrop-blur-sm shadow-sm ${
          dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-white/80"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
          disabled={isReading || isProcessing}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-slate-100">
            {isReading ? (
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            ) : (
              <Upload className={`w-8 h-8 ${dragActive ? "text-indigo-600" : "text-slate-400"}`} />
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-900">
              {isReading ? "Processing file..." : "Upload comments file"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Drag & drop or click to select CSV/Excel file
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200">
            Supported columns: content/body, date, likes, replies, etc.
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Error</AlertTitle>
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
