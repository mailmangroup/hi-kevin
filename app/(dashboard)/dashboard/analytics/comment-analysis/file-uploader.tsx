
"use client"

import { useCallback, useState } from "react"
import { Upload, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { processFile, type ProcessedComment } from "@/lib/utils/file-processor"

type ModelMode = "flash" | "plus" | "flash-thinking" | "plus-thinking"

export type AnalysisModelModes = {
  model_schema: ModelMode
  model_tagging: ModelMode
  model_tagging_rerun: ModelMode
  model_persona: ModelMode
  model_topic: ModelMode
  model_insights: ModelMode
}

const MODEL_MODE_OPTIONS: ModelMode[] = ["flash", "plus", "flash-thinking", "plus-thinking"]

const DEFAULT_ANALYSIS_MODEL_MODES: AnalysisModelModes = {
  model_schema: "plus-thinking",
  model_tagging: "flash",
  model_tagging_rerun: "plus",
  model_persona: "plus",
  model_topic: "plus",
  model_insights: "plus-thinking",
}

interface FileUploaderProps {
  onDataProcessed: (
    data: ProcessedComment[],
    filename: string,
    name: string,
    postContent: string,
    modelModes: AnalysisModelModes
  ) => void
  isProcessing?: boolean
}

export function FileUploader({ onDataProcessed, isProcessing }: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [name, setName] = useState("")
  const [postContent, setPostContent] = useState("")
  const [modelModes, setModelModes] = useState<AnalysisModelModes>(DEFAULT_ANALYSIS_MODEL_MODES)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setIsReading(true)
    try {
      const comments = await processFile(file)
      if (comments.length === 0) {
        setError("No valid comments found in file. Please check column names.")
      } else {
        onDataProcessed(comments, file.name, name, postContent, modelModes)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to process file")
    } finally {
      setIsReading(false)
    }
  }, [onDataProcessed, name, postContent, modelModes])

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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Analysis Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Analysis Name <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(optional)</span>
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. March Campaign Comments"
          disabled={isReading || isProcessing}
          className="bg-white/70 dark:bg-slate-800/70"
        />
      </div>

      {/* Post Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Original post / video content <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(optional)</span>
        </label>
        <Textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder="Paste the post text, video description, or topic background so the AI has context about what the comments are discussing..."
          rows={4}
          disabled={isReading || isProcessing}
          className="bg-white/70 dark:bg-slate-800/70 resize-none text-sm"
        />
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Model mode by phase
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Schema generation</label>
            <Select
              value={modelModes.model_schema}
              onValueChange={(value: ModelMode) => setModelModes(prev => ({ ...prev, model_schema: value }))}
              disabled={isReading || isProcessing}
            >
              <SelectTrigger className="bg-white/70 dark:bg-slate-800/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_MODE_OPTIONS.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Initial batch tagging</label>
            <Select
              value={modelModes.model_tagging}
              onValueChange={(value: ModelMode) => setModelModes(prev => ({ ...prev, model_tagging: value }))}
              disabled={isReading || isProcessing}
            >
              <SelectTrigger className="bg-white/70 dark:bg-slate-800/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_MODE_OPTIONS.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Low-confidence rerun</label>
            <Select
              value={modelModes.model_tagging_rerun}
              onValueChange={(value: ModelMode) => setModelModes(prev => ({ ...prev, model_tagging_rerun: value }))}
              disabled={isReading || isProcessing}
            >
              <SelectTrigger className="bg-white/70 dark:bg-slate-800/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_MODE_OPTIONS.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Persona analysis</label>
            <Select
              value={modelModes.model_persona}
              onValueChange={(value: ModelMode) => setModelModes(prev => ({ ...prev, model_persona: value }))}
              disabled={isReading || isProcessing}
            >
              <SelectTrigger className="bg-white/70 dark:bg-slate-800/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_MODE_OPTIONS.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Topic labeling</label>
            <Select
              value={modelModes.model_topic}
              onValueChange={(value: ModelMode) => setModelModes(prev => ({ ...prev, model_topic: value }))}
              disabled={isReading || isProcessing}
            >
              <SelectTrigger className="bg-white/70 dark:bg-slate-800/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_MODE_OPTIONS.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Insights generation</label>
            <Select
              value={modelModes.model_insights}
              onValueChange={(value: ModelMode) => setModelModes(prev => ({ ...prev, model_insights: value }))}
              disabled={isReading || isProcessing}
            >
              <SelectTrigger className="bg-white/70 dark:bg-slate-800/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_MODE_OPTIONS.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Comments file</label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-sm ${
            dragActive ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-white/80 dark:hover:bg-slate-700/50"
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
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-700">
              {isReading ? (
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Upload className={`w-8 h-8 ${dragActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                {isReading ? "Processing file..." : "Upload comments file"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Drag & drop or click to select CSV/Excel file
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded border border-slate-200 dark:border-slate-600">
              Supported columns: content/body, date, likes, replies, etc.
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-900 dark:text-red-200">Error</AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
