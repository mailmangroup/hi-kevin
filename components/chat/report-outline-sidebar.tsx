"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, FileText, BarChart, Table, LayoutGrid, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useArtifact } from "@/components/chat/artifact-context"

interface ReportOutlineSidebarProps {
  report: any
}

interface OutlineItem {
  id: string
  title: string
  pageIndex: number
  sectionIndex?: number
  type?: string
  children?: OutlineItem[]
}

export function ReportOutlineSidebar({ report }: ReportOutlineSidebarProps) {
  const { isOutlineCollapsed, setIsOutlineCollapsed, reportNavigation, setReportNavigation } = useArtifact()
  const [expandedPages, setExpandedPages] = React.useState<Record<string, boolean>>({})

  // Generate outline structure
  const outline = React.useMemo<OutlineItem[]>(() => {
    if (!report?.pages) return []

    return report.pages.map((page: any, pageIdx: number) => ({
      id: `page-${pageIdx}`,
      title: page.title || `Page ${pageIdx + 1}`,
      pageIndex: pageIdx,
      children: page.sections?.map((section: any, sectionIdx: number) => ({
        id: `section-${pageIdx}-${sectionIdx}`,
        title: cleanSectionTitle(section.title) || `Section ${sectionIdx + 1}`,
        pageIndex: pageIdx,
        sectionIndex: sectionIdx,
        type: section.type
      }))
    }))
  }, [report])

  // Initialize expanded state for all pages
  React.useEffect(() => {
    if (outline.length > 0 && Object.keys(expandedPages).length === 0) {
      const initialExpanded: Record<string, boolean> = {}
      outline.forEach(page => {
        initialExpanded[page.id] = true
      })
      setExpandedPages(initialExpanded)
    }
  }, [outline])

  const togglePage = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedPages(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }))
  }

  const handleNavigation = (pageIndex: number, sectionIndex?: number) => {
    // Update context state
    setReportNavigation({
      pageNumber: pageIndex + 1,
      sectionIndexes: sectionIndex !== undefined ? [sectionIndex + 1] : []
    })

    // Scroll to element
    setTimeout(() => {
      const selector = sectionIndex !== undefined 
        ? `[data-page="${pageIndex + 1}"][data-section="${sectionIndex + 1}"]`
        : `[data-page="${pageIndex + 1}"]`
      
      const el = document.querySelector(selector)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'chart': return <BarChart className="h-3 w-3" />
      case 'table': return <Table className="h-3 w-3" />
      case 'stat_tiles': return <LayoutGrid className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
    }
  }

  // Helper to clean titles
  function cleanSectionTitle(title: string) {
    if (!title) return ""
    return title.replace(/^\d+\.\s*/, "").trim()
  }

  if (isOutlineCollapsed) {
    return (
      <div className="w-12 border-r border-border bg-muted/10 flex flex-col items-center py-4 gap-4 h-full">
        <button 
          onClick={() => setIsOutlineCollapsed(false)}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title="Expand Outline"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="flex-1 flex flex-col gap-2 w-full px-2">
           {/* Mini indicators for pages */}
           {outline.map((page) => (
             <div 
               key={page.id} 
               className={cn(
                 "w-full aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium cursor-pointer transition-colors",
                 reportNavigation.pageNumber === page.pageIndex + 1 
                   ? "bg-primary text-primary-foreground" 
                   : "bg-muted hover:bg-muted/80 text-muted-foreground"
               )}
               onClick={() => handleNavigation(page.pageIndex)}
               title={page.title}
             >
               {page.pageIndex + 1}
             </div>
           ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r border-border bg-muted/10 flex flex-col h-full flex-shrink-0">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="font-medium text-sm">Outline</span>
        <button 
          onClick={() => setIsOutlineCollapsed(true)}
          className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground"
          title="Collapse"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {outline.map((page) => (
            <div key={page.id} className="space-y-1">
              {/* Page Header */}
              <div 
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors group",
                  reportNavigation.pageNumber === page.pageIndex + 1 && reportNavigation.sectionIndexes.length === 0
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted text-foreground/80"
                )}
                onClick={() => handleNavigation(page.pageIndex)}
              >
                <button 
                  onClick={(e) => togglePage(page.id, e)}
                  className="p-0.5 rounded-sm hover:bg-background/50 text-muted-foreground"
                >
                  {expandedPages[page.id] ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRightIcon className="h-3 w-3" />
                  )}
                </button>
                <span className="truncate flex-1">{page.title}</span>
              </div>

              {/* Sections */}
              {expandedPages[page.id] && page.children && (
                <div className="ml-4 space-y-0.5 border-l border-border/40 pl-2">
                  {page.children.map((section) => (
                    <div
                      key={section.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors",
                        reportNavigation.pageNumber === page.pageIndex + 1 && 
                        reportNavigation.sectionIndexes.includes(section.sectionIndex! + 1)
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted text-muted-foreground"
                      )}
                      onClick={() => handleNavigation(page.pageIndex, section.sectionIndex)}
                    >
                      {getIconForType(section.type)}
                      <span className="truncate flex-1">{section.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
