"use client"

import * as React from "react"
import {
  ChevronDown,
  CheckCircle2,
  Loader2,
  Circle,
  Search,
  Lightbulb,
  ClipboardList,
  FileText,
  Bot,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { MessageContent } from "./message-content"

// --- Types ---

export interface ResearchActivity {
  agent: "coordinator" | "planner" | "researcher" | "analyst" | "reporter"
  stepIndex: number
  content: string
  isComplete: boolean
}

export interface ResearchPlanStep {
  title: string
  type: string
  status: "pending" | "in_progress" | "completed"
}

export interface ResearchPlanData {
  title: string
  steps: ResearchPlanStep[]
}

export interface DeepResearchData {
  plan: ResearchPlanData | null
  activities: ResearchActivity[]
  isComplete: boolean
}

// --- Agent display config ---

const AGENT_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; borderColor: string; bgColor: string; textColor: string }
> = {
  coordinator: {
    label: "Coordinator",
    icon: Bot,
    borderColor: "border-gray-200",
    bgColor: "bg-gray-50/50",
    textColor: "text-gray-700",
  },
  planner: {
    label: "Planning",
    icon: ClipboardList,
    borderColor: "border-green-200",
    bgColor: "bg-green-50/50",
    textColor: "text-green-700",
  },
  researcher: {
    label: "Researching",
    icon: Search,
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50/50",
    textColor: "text-blue-700",
  },
  analyst: {
    label: "Analyzing",
    icon: Lightbulb,
    borderColor: "border-amber-200",
    bgColor: "bg-amber-50/50",
    textColor: "text-amber-700",
  },
  reporter: {
    label: "Writing Report",
    icon: FileText,
    borderColor: "border-indigo-200",
    bgColor: "bg-indigo-50/50",
    textColor: "text-indigo-700",
  },
}

// --- Step status icon ---

function StepStatusIcon({ status }: { status: ResearchPlanStep["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
    case "in_progress":
      return <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin flex-shrink-0" />
    default:
      return <Circle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
  }
}

// --- Research Plan Section ---

function ResearchPlanSection({
  plan,
  isStreaming,
}: {
  plan: ResearchPlanData
  isStreaming: boolean
}) {
  const allComplete = plan.steps.every((s) => s.status === "completed")
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [userToggled, setUserToggled] = React.useState(false)

  // Auto-collapse when all steps complete
  React.useEffect(() => {
    if (allComplete && !userToggled) {
      setIsExpanded(false)
    }
  }, [allComplete, userToggled])

  const handleToggle = () => {
    setUserToggled(true)
    setIsExpanded(!isExpanded)
  }

  const completedCount = plan.steps.filter((s) => s.status === "completed").length

  return (
    <div className="mb-3 rounded-lg border border-green-200 bg-green-50/50 overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-green-100/50 transition-colors"
      >
        <ClipboardList className="h-4 w-4 text-green-600 flex-shrink-0" />
        <span className="text-xs font-medium text-green-700 flex-1 truncate">
          Research Plan: {plan.title}
        </span>
        <span className="text-[10px] text-green-600 flex-shrink-0">
          {completedCount}/{plan.steps.length}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-green-600 transition-transform flex-shrink-0",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-green-100">
          <ul className="space-y-1.5">
            {plan.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <StepStatusIcon status={step.status} />
                <span
                  className={cn(
                    "leading-tight",
                    step.status === "completed"
                      ? "text-gray-500"
                      : step.status === "in_progress"
                        ? "text-gray-900 font-medium"
                        : "text-gray-600"
                  )}
                >
                  {i + 1}. {step.title}
                  <span className="text-gray-400 ml-1">({step.type})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// --- Research Step Section (collapsible agent output) ---

function ResearchStepSection({
  stepIndex,
  stepTitle,
  stepType,
  status,
  activities,
  isStreaming,
}: {
  stepIndex: number
  stepTitle: string
  stepType: string
  status: "pending" | "in_progress" | "completed"
  activities: ResearchActivity[]
  isStreaming: boolean
}) {
  const [isExpanded, setIsExpanded] = React.useState(status !== "completed")
  const [userToggled, setUserToggled] = React.useState(false)
  const prevStatusRef = React.useRef(status)

  // Auto-collapse when step completes (unless user toggled)
  React.useEffect(() => {
    if (prevStatusRef.current === "in_progress" && status === "completed" && !userToggled) {
      setIsExpanded(false)
    }
    prevStatusRef.current = status
  }, [status, userToggled])

  const handleToggle = () => {
    setUserToggled(true)
    setIsExpanded(!isExpanded)
  }

  const agentType = activities[0]?.agent || stepType
  const config = AGENT_CONFIG[agentType] || AGENT_CONFIG.researcher
  const IconComponent = config.icon

  // Combine all activity content for this step
  const combinedContent = activities
    .filter((a) => a.content)
    .map((a) => a.content)
    .join("")

  return (
    <div className={cn("mb-2 rounded-lg border overflow-hidden", config.borderColor, config.bgColor)}>
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
          `hover:${config.bgColor}`
        )}
      >
        <IconComponent className={cn("h-4 w-4 flex-shrink-0", config.textColor)} />
        {status === "in_progress" ? (
          <Loader2 className="h-3 w-3 animate-spin text-blue-600 flex-shrink-0" />
        ) : status === "completed" ? (
          <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
        ) : null}
        <span className={cn("text-xs font-medium flex-1 truncate", config.textColor)}>
          Step {stepIndex + 1}: {stepTitle}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform flex-shrink-0",
            config.textColor,
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>

      {isExpanded && combinedContent && (
        <div className="px-4 pb-3 pt-1 border-t border-opacity-50" style={{ borderColor: "inherit" }}>
          <div className="text-xs text-gray-700 leading-relaxed">
            <MessageContent content={combinedContent} className="prose-xs" />
            {isStreaming && status === "in_progress" && (
              <span className="inline-flex ml-1">
                <span className="animate-pulse">▊</span>
              </span>
            )}
          </div>
        </div>
      )}

      {isExpanded && !combinedContent && status === "in_progress" && (
        <div className="px-4 pb-3 pt-1 border-t border-opacity-50" style={{ borderColor: "inherit" }}>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{config.label}...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Component ---

interface DeepResearchDisplayProps {
  data: DeepResearchData
  isStreaming: boolean
}

export function DeepResearchDisplay({ data, isStreaming }: DeepResearchDisplayProps) {
  if (!data.plan && data.activities.length === 0) {
    // Show planning indicator before plan arrives
    return (
      <div className="mb-3 rounded-lg border border-green-200 bg-green-50/50 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <Loader2 className="h-4 w-4 text-green-600 animate-spin flex-shrink-0" />
          <span className="text-xs font-medium text-green-700">Creating research plan...</span>
        </div>
      </div>
    )
  }

  // Group activities by stepIndex
  const activitiesByStep = new Map<number, ResearchActivity[]>()
  for (const activity of data.activities) {
    // Skip coordinator and planner activities from step display
    if (activity.agent === "coordinator" || activity.agent === "planner") continue
    const existing = activitiesByStep.get(activity.stepIndex) || []
    existing.push(activity)
    activitiesByStep.set(activity.stepIndex, existing)
  }

  return (
    <div className="space-y-1">
      {/* Research Plan */}
      {data.plan && (
        <ResearchPlanSection plan={data.plan} isStreaming={isStreaming} />
      )}

      {/* Research Steps */}
      {data.plan?.steps.map((step, i) => {
        const stepActivities = activitiesByStep.get(i) || []
        // Only render step section if it has started (has activities or is in_progress/completed)
        if (step.status === "pending" && stepActivities.length === 0) return null

        return (
          <ResearchStepSection
            key={i}
            stepIndex={i}
            stepTitle={step.title}
            stepType={step.type}
            status={step.status}
            activities={stepActivities}
            isStreaming={isStreaming}
          />
        )
      })}
    </div>
  )
}
