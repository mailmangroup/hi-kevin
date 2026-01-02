"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, FileText, Video, Image as ImageIcon, Calendar } from "lucide-react"
import { mockContentItems } from "@/lib/mock/content"
import { format } from "date-fns"
import { cn } from "@/lib/utils/cn"

export function DraftWorkspace() {
  const drafts = mockContentItems.filter(item => item.status === 'draft' || item.status === 'idea')

  const getPlatformIcon = (platform: string) => {
    // In a real app, use SVG icons. Using colored dots/text for now as per design system hints
    switch(platform) {
      case 'xiaohongshu': return <div className="w-2 h-2 rounded-full bg-[#FF2442]" />
      case 'douyin': return <div className="w-2 h-2 rounded-full bg-black" />
      case 'weibo': return <div className="w-2 h-2 rounded-full bg-[#E6162D]" />
      case 'wechat': return <div className="w-2 h-2 rounded-full bg-[#07C160]" />
      default: return <div className="w-2 h-2 rounded-full bg-gray-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'post': return <FileText className="h-4 w-4 text-muted-foreground" />
      case 'video': return <Video className="h-4 w-4 text-muted-foreground" />
      case 'image': return <ImageIcon className="h-4 w-4 text-muted-foreground" />
      default: return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Drafts</h3>
        <Button variant="outline" size="sm">View All</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drafts.map((draft) => (
          <Card key={draft.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize gap-1.5 pl-1.5">
                  {getPlatformIcon(draft.platform)}
                  {draft.platform}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <h4 className="font-medium mb-2 line-clamp-2 min-h-[3rem]">{draft.title}</h4>
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {draft.body.slice(0, 100)}...
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {getTypeIcon(draft.type)}
                <span className="capitalize">{draft.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(draft.updatedAt), 'MMM d')}</span>
              </div>
            </div>
          </Card>
        ))}
        
        {/* Create New Draft Card */}
        <Card className="p-4 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[200px] text-muted-foreground hover:text-primary">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
            <PlusIcon className="h-6 w-6" />
          </div>
          <span className="font-medium">Create New Draft</span>
        </Card>
      </div>
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
