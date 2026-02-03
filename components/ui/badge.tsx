import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[6px] h-6 px-2.5 text-[11px] font-semibold uppercase tracking-[0.3px] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        secondary: "bg-border-light text-muted-foreground",
        destructive: "bg-error text-white",
        outline: "text-foreground border border-border bg-transparent",
        success: "bg-success text-white",
        warning: "bg-warning text-white",
        info: "bg-info text-white",
        // Platform badges
        xiaohongshu: "bg-[#FF2442] text-white",
        douyin: "bg-black text-white",
        weibo: "bg-[#E6162D] text-white",
        wechat: "bg-[#07C160] text-white",
        // Priority badges
        high: "bg-red-500/10 text-red-600 border border-red-500/20 backdrop-blur-sm",
        medium: "bg-amber-500/10 text-amber-600 border border-amber-500/20 backdrop-blur-sm",
        low: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 backdrop-blur-sm",
        // Status badges (per DESIGN.md)
        draft: "bg-border-light text-muted-foreground",
        scheduled: "bg-success-light text-success-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
