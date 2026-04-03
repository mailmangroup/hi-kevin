"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Plus, Trash2, Eye, Code2, Loader2, Zap, FileText, Folder } from "lucide-react"
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill } from "@/lib/hooks/use-projects"
import { type Skill } from "@/lib/api/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils/cn"

type TreeNode = { name: string; children: Record<string, TreeNode>; isFile: boolean }

function buildTree(files: string[]): TreeNode {
  const root: TreeNode = { name: "", children: {}, isFile: false }
  // Always include SKILL.md at root
  root.children["SKILL.md"] = { name: "SKILL.md", children: {}, isFile: true }
  for (const path of files) {
    const parts = path.split("/")
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!node.children[part]) {
        node.children[part] = { name: part, children: {}, isFile: i === parts.length - 1 }
      }
      node = node.children[part]
    }
  }
  return root
}

function TreeNodes({ nodes, depth = 0 }: { nodes: Record<string, TreeNode>; depth?: number }) {
  return (
    <>
      {Object.values(nodes).map((node) => (
        <div key={node.name}>
          <div
            className="flex items-center gap-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            style={{ paddingLeft: `${depth * 12 + 4}px` }}
          >
            {node.isFile
              ? <FileText className="h-3 w-3 flex-shrink-0" />
              : <Folder className="h-3 w-3 flex-shrink-0 text-blue-400" />
            }
            <span className="truncate">{node.name}</span>
          </div>
          {!node.isFile && Object.keys(node.children).length > 0 && (
            <TreeNodes nodes={node.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </>
  )
}

function SkillDetail({
  skill,
  onClose,
}: {
  skill: Skill
  onClose: () => void
}) {
  const { toast } = useToast()
  const { mutate: updateSkill, isPending: isUpdating } = useUpdateSkill()
  const { mutate: deleteSkill, isPending: isDeleting } = useDeleteSkill()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditingContent, setIsEditingContent] = useState(false)

  const [name, setName] = useState(skill.name)
  const [description, setDescription] = useState(skill.description)
  const [content, setContent] = useState(skill.content)
  const [isDirty, setIsDirty] = useState(false)

  const markDirty = () => setIsDirty(true)

  const handleSave = () => {
    updateSkill(
      { id: skill.id, data: { name, description, content } },
      {
        onSuccess: () => {
          toast({ title: "Skill saved", type: "success" })
          setIsDirty(false)
        },
        onError: (e: any) => toast({ title: e.message || "Failed to save", type: "error" }),
      }
    )
  }

  const handleDelete = () => {
    deleteSkill(skill.id, {
      onSuccess: () => {
        toast({ title: "Skill deleted", type: "success" })
        onClose()
      },
      onError: (e: any) => toast({ title: e.message || "Failed to delete", type: "error" }),
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty() }}
            className="text-xl font-bold border-transparent bg-transparent px-0 h-auto text-xl focus-visible:ring-0 focus-visible:border-border"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
          onClick={() => setIsDeleteOpen(true)}
          disabled={isDeleting}
          title="Delete skill"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-5 text-xs text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">Added by</span>{" "}
          <span>User</span>
        </div>
        <div>
          <span className="font-medium text-foreground">Last updated</span>{" "}
          <span>{formatDistanceToNow(new Date(skill.updated_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
        <Textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); markDirty() }}
          placeholder="Describe what this skill does..."
          className="min-h-[60px] text-sm resize-none"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content</p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6", !isEditingContent && "text-primary")}
              onClick={() => setIsEditingContent(false)}
              title="Preview"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6", isEditingContent && "text-primary")}
              onClick={() => setIsEditingContent(true)}
              title="Edit"
            >
              <Code2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {isEditingContent ? (
          <Textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); markDirty() }}
            placeholder="Write the skill content in markdown..."
            className="flex-1 resize-none text-sm font-mono min-h-[200px]"
          />
        ) : (
          <div className="flex-1 overflow-y-auto rounded-md border border-input bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap min-h-[200px]">
            {content || <span className="text-muted-foreground italic">No content yet. Click edit to add.</span>}
          </div>
        )}
      </div>

      {/* File tree */}
      {(skill.files.length > 0) && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Files</p>
          <div className="rounded-md border border-input bg-muted/30 p-2">
            <TreeNodes nodes={buildTree(skill.files).children} />
          </div>
        </div>
      )}

      {/* Footer actions */}
      {isDirty && (
        <div className="flex items-center justify-end mt-4 pt-4 border-t border-border">
          <Button size="sm" onClick={handleSave} disabled={isUpdating} className="gap-1.5">
            {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Skill"
        description={`Are you sure you want to delete "${skill.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function CreateSkillForm({ onCancel }: { onCancel: () => void }) {
  const { toast } = useToast()
  const { mutate: createSkill, isPending } = useCreateSkill()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: "Name is required", type: "error" })
      return
    }
    createSkill(
      { name: name.trim(), description, content },
      {
        onSuccess: () => {
          toast({ title: "Skill created", type: "success" })
          onCancel()
        },
        onError: (e: any) => toast({ title: e.message || "Failed to create skill", type: "error" }),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. write-and-distribute"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this skill do?"
          className="min-h-[60px] resize-none"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Content</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Skill instructions in markdown..."
          className="min-h-[120px] resize-none font-mono text-sm"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Create Skill
        </Button>
      </div>
    </form>
  )
}

export function SkillsSection() {
  const { data, isLoading, isError, error } = useSkills()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const skills = data?.skills ?? []
  const selected = skills.find((s) => s.id === selectedId) ?? null

  return (
    <Card className="p-0 overflow-hidden">
      <div className="grid grid-cols-[220px_1fr] divide-x divide-border min-h-[500px]">
        {/* Left panel: skill list */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-3 py-3 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal skills</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => { setIsCreating(true); setSelectedId(null) }}
              title="New skill"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : isError ? (
              <div className="p-3 text-xs text-destructive">{(error as Error)?.message || "Failed to load skills"}</div>
            ) : skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
                <Zap className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No skills yet.<br />Click + to create one.</p>
              </div>
            ) : (
              skills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => { setSelectedId(skill.id); setIsCreating(false) }}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                    selectedId === skill.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{skill.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel: detail / create */}
        <div className="p-6 overflow-y-auto">
          {isCreating ? (
            <>
              <h2 className="text-lg font-semibold mb-4">New Skill</h2>
              <CreateSkillForm onCancel={() => setIsCreating(false)} />
            </>
          ) : selected ? (
            <SkillDetail key={selected.id} skill={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-muted-foreground">
              <Zap className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm">Select a skill to view or edit it,<br />or click + to create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
