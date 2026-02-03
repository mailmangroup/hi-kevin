"use client"

import * as React from "react"

export interface ArtifactData {
  id: string
  type: "chart" | "code" | "table" | "report" | "data"
  title?: string
  data: any
  toolName?: string
  session?: {
    action?: string
    date_start?: string
    date_end?: string
    networks?: string[]
  }
}

export interface ReportNavigation {
  pageNumber: number
  sectionIndexes: number[]
}

interface ArtifactContextValue {
  // Currently selected artifact for the panel
  selectedArtifact: ArtifactData | null
  // Whether the panel is open
  isPanelOpen: boolean
  // Open the panel with a specific artifact
  openArtifact: (artifact: ArtifactData) => void
  // Close the panel
  closePanel: () => void
  // Toggle panel visibility
  togglePanel: () => void
  // Report navigation state
  reportNavigation: ReportNavigation
  setReportNavigation: React.Dispatch<React.SetStateAction<ReportNavigation>>
  // Sidebar state
  isOutlineCollapsed: boolean
  setIsOutlineCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

const ArtifactContext = React.createContext<ArtifactContextValue | undefined>(undefined)

export function ArtifactProvider({ children }: { children: React.ReactNode }) {
  const [selectedArtifact, setSelectedArtifact] = React.useState<ArtifactData | null>(null)
  const [isPanelOpen, setIsPanelOpen] = React.useState(false)
  const [reportNavigation, setReportNavigation] = React.useState<ReportNavigation>({ pageNumber: 1, sectionIndexes: [] })
  const [isOutlineCollapsed, setIsOutlineCollapsed] = React.useState(false)

  const openArtifact = React.useCallback((artifact: ArtifactData) => {
    setSelectedArtifact(artifact)
    setIsPanelOpen(true)
  }, [])

  const closePanel = React.useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  const togglePanel = React.useCallback(() => {
    setIsPanelOpen(prev => !prev)
  }, [])

  const value = React.useMemo(() => ({
    selectedArtifact,
    isPanelOpen,
    openArtifact,
    closePanel,
    togglePanel,
    reportNavigation,
    setReportNavigation,
    isOutlineCollapsed,
    setIsOutlineCollapsed
  }), [selectedArtifact, isPanelOpen, openArtifact, closePanel, togglePanel, reportNavigation, isOutlineCollapsed])

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  )
}

export function useArtifact() {
  const context = React.useContext(ArtifactContext)
  if (!context) {
    throw new Error("useArtifact must be used within an ArtifactProvider")
  }
  return context
}
