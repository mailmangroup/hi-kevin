import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const ANALYTICS_CARDS = [
  {
    title: "Post Performance Analysis",
    description: "Deep dive into platform performance, engagement, and growth trends.",
    href: "/dashboard/analytics/post-performance"
  },
  {
    title: "Comment Analysis",
    description: "Explore comment sentiment, themes, and community insights.",
    href: "/dashboard/analytics/comment-analysis"
  }
]

export default function AnalyticsLandingPage() {
  return (
    <div className="space-y-8 p-8 pt-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics & Research</h1>
        <p className="text-muted-foreground mt-2">
          Choose an analysis module to explore performance or community insights.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {ANALYTICS_CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="group h-full">
            <Card className="relative h-full overflow-hidden border border-white/40 bg-white/35 backdrop-blur-2xl shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:border-white/60 group-hover:shadow-[0_16px_40px_-14px_rgba(15,23,42,0.25)]">
              <CardHeader className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                    <CardDescription className="mt-2">{card.description}</CardDescription>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-800/40 text-primary shadow-[0_6px_18px_-10px_rgba(15,23,42,0.25)] dark:shadow-[0_6px_18px_-10px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-105 group-hover:bg-white/55 dark:group-hover:bg-slate-700/55">
                    →
                  </span>
                </div>
              </CardHeader>
              <CardFooter className="relative text-sm font-medium text-foreground">
                <span className="transition-transform duration-300 group-hover:translate-x-1">View details</span>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
