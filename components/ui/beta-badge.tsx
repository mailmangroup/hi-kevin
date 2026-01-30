import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Beaker } from "lucide-react"

export function BetaBadge({ label = "Mock Data" }: { label?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="h-5 px-1.5 gap-1 text-[10px] font-normal border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-transparent dark:border-amber-500/50 dark:text-amber-400">
            <Beaker className="h-3 w-3" />
            Beta
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label} - functionality is simulated</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
