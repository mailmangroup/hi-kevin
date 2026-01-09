"use client"

import { Lead } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, Calendar, User, Globe } from "lucide-react"

interface LeadDetailDialogProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailDialog({ lead, open, onOpenChange }: LeadDetailDialogProps) {
  if (!lead) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between pr-8">
            <div>
              <DialogTitle className="text-xl">{lead.name}</DialogTitle>
              {lead.title && (
                <p className="text-muted-foreground">{lead.title}</p>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {lead.stage}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-primary">
              <User className="h-4 w-4" /> Contact Info
            </h4>
            <div className="space-y-3 text-sm">
              {lead.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lead.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="hover:underline text-blue-600">
                  {lead.email}
                </a>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-primary">
              <Globe className="h-4 w-4" /> Lead Info
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">Source:</span>
                <span className="capitalize font-medium">{lead.source}</span>
              </div>
               <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">Score:</span>
                <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{lead.score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created: {lead.createdAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        {lead.tags && lead.tags.length > 0 && (
          <div className="pt-4 border-t border-border">
             <div className="flex flex-wrap gap-2">
                {lead.tags.map(tag => (
                   <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
             </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
