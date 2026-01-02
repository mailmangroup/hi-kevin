"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Target,
  FileText,
  Megaphone,
  BarChart3,
  TrendingUp,
  MapPin,
  Handshake,
  HeartHandshake,
  Radio,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Clock
} from "lucide-react"

// Define the 10 core functions based on marketing.md
const MARKETING_FUNCTIONS = [
  {
    id: "demand-gen",
    title: "Demand Generation",
    icon: Users,
    description: "Multi-channel customer acquisition and pipeline contribution.",
    agent: "Leads Agent",
    agentStatus: "active",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    details: {
      responsibilities: ["Multi-channel acquisition", "Pipeline contribution", "Lead nurturing"],
      kpi: "MQL Volume, SQL Conversion Rate, Marketing Pipeline Contribution (30%+)",
      teamSize: "3-5 people",
      kevinHelps: "Kevin's Leads Agent automatically scores leads (MQL/SQL), routes them to the right pipeline, and triggers personalized nurturing sequences."
    }
  },
  {
    id: "product-marketing",
    title: "Product Marketing",
    icon: Target,
    description: "Product positioning, GTM strategy, and sales enablement.",
    agent: "Campaign Agent",
    agentStatus: "active",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    details: {
      responsibilities: ["Product positioning", "GTM strategy", "Sales enablement"],
      kpi: "Product Revenue, Win Rate, Sales Asset Usage",
      teamSize: "2-4 people",
      kevinHelps: "Kevin's Campaign Agent helps you structure GTM plans, while the Content Agent ensures all messaging aligns with your core value proposition."
    }
  },
  {
    id: "content-marketing",
    title: "Content Marketing",
    icon: FileText,
    description: "Content production, SEO, and thought leadership.",
    agent: "Content Agent",
    agentStatus: "active",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-100",
    details: {
      responsibilities: ["Content production", "SEO", "Thought leadership"],
      kpi: "Organic Traffic, Content Conversion Rate, Publishing Frequency",
      teamSize: "2-4 people",
      kevinHelps: "Kevin's Content Agent generates SEO-optimized drafts, adapts them for local platforms (Xiaohongshu, WeChat), and manages your editorial calendar."
    }
  },
  {
    id: "brand-marketing",
    title: "Brand Marketing",
    icon: Megaphone,
    description: "Brand strategy, visual identity, and brand consistency.",
    agent: "Brand Safety Agent",
    agentStatus: "active",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    details: {
      responsibilities: ["Brand strategy", "Visual identity", "Brand consistency"],
      kpi: "Brand Awareness, NPS, Brand Search Volume",
      teamSize: "1-3 people",
      kevinHelps: "Kevin's Brand Safety Agent reviews every piece of content against your brand guidelines to ensure a consistent voice and visual identity."
    }
  },
  {
    id: "marketing-ops",
    title: "Marketing Operations",
    icon: BarChart3,
    description: "Tech stack, data management, and process optimization.",
    agent: "Analytics Agent",
    agentStatus: "active",
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-100",
    details: {
      responsibilities: ["Tech stack management", "Data governance", "Process optimization"],
      kpi: "System Uptime, Data Accuracy, Marketing ROI",
      teamSize: "2-4 people",
      kevinHelps: "Kevin's Analytics Agent unifies data from all platforms into one dashboard, automating reporting and providing actionable insights."
    }
  },
  {
    id: "growth-marketing",
    title: "Growth Marketing",
    icon: TrendingUp,
    description: "User growth, conversion optimization, and retention.",
    agent: "Analytics Agent",
    agentStatus: "active",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-100",
    details: {
      responsibilities: ["User growth", "CRO", "Retention"],
      kpi: "CAC, LTV:CAC Ratio (Goal 3:1), Retention Rate",
      teamSize: "2-4 people",
      kevinHelps: "Kevin tracks your LTV:CAC ratio in real-time and suggests optimization strategies based on competitor data."
    }
  },
  {
    id: "field-marketing",
    title: "Field Marketing",
    icon: MapPin,
    description: "Regional events, trade shows, and customer dinners.",
    agent: "Events Agent",
    agentStatus: "coming_soon",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
    details: {
      responsibilities: ["Regional events", "Trade shows", "Customer dinners"],
      kpi: "Event ROI, Regional Pipeline Contribution",
      teamSize: "Regional based",
      kevinHelps: "Kevin will soon help you plan event logistics, manage registrations, and track offline-to-online attribution."
    }
  },
  {
    id: "partner-marketing",
    title: "Partner Marketing",
    icon: Handshake,
    description: "Channel enablement, co-marketing, and MDF management.",
    agent: "Partners Agent",
    agentStatus: "coming_soon",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-100",
    details: {
      responsibilities: ["Channel enablement", "Co-marketing", "MDF management"],
      kpi: "Channel Revenue, Partner Activation Rate",
      teamSize: "1-3 people",
      kevinHelps: "Future capabilities include automated partner portal management and co-branded asset generation."
    }
  },
  {
    id: "customer-marketing",
    title: "Customer Marketing",
    icon: HeartHandshake,
    description: "Retention, case studies, and advocate programs.",
    agent: "Content Agent",
    agentStatus: "active",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
    details: {
      responsibilities: ["Customer retention", "Case study production", "Advocate programs"],
      kpi: "NRR (Net Revenue Retention), Referral Rate, Case Study Volume",
      teamSize: "1-2 people",
      kevinHelps: "Use Kevin's Content Agent to turn customer success stories into compelling case studies and social proof assets."
    }
  },
  {
    id: "comms-pr",
    title: "Communications / PR",
    icon: Radio,
    description: "Media relations, crisis management, and internal comms.",
    agent: "Research Agent",
    agentStatus: "active",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-100",
    details: {
      responsibilities: ["Media relations", "Crisis PR", "Internal comms"],
      kpi: "Media Impressions, Share of Voice (SOV), Sentiment",
      teamSize: "1-3 people",
      kevinHelps: "Kevin's Research Agent monitors brand sentiment and competitor news in real-time, alerting you to potential PR risks."
    }
  }
]

export function MarketingFunctions() {
  const [selectedFunction, setSelectedFunction] = useState<typeof MARKETING_FUNCTIONS[0] | null>(null)

  return (
    <section className="py-16 bg-white relative overflow-hidden" id="marketing-functions">
      {/* Ambient background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-50/50 rounded-full blur-[100px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-[1600px]">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>The Impossible Grid</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent"
          >
            The Standard for High-Performance Marketing<br className="hidden md:block" /> is Impossible for One Person.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed"
          >
            A mature marketing function isn&apos;t just &quot;posting on social.&quot; It requires managing these <strong className="text-slate-900">10 Core Functions</strong> simultaneously.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {MARKETING_FUNCTIONS.map((func, index) => (
            <motion.div
              key={func.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => setSelectedFunction(func)}
              className={`
                group relative bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm 
                hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 hover:border-indigo-100
                transition-all duration-300 cursor-pointer
                flex items-start gap-4 overflow-hidden
              `}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${func.bgColor.replace('bg-', 'bg-gradient-to-b from-white via-') + '-500 to-white'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

              <div className={`shrink-0 w-12 h-12 rounded-lg ${func.bgColor} flex items-center justify-center ${func.color} ring-1 ring-inset ${func.borderColor} group-hover:scale-105 transition-transform duration-300`}>
                <func.icon className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-900 transition-colors truncate pr-2">
                    {func.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>

                <p className="text-sm text-slate-500 mb-3 leading-snug line-clamp-2 group-hover:text-slate-600">
                  {func.description}
                </p>

                <div className="flex items-center">
                  {func.agentStatus === 'active' ? (
                    <Badge variant="secondary" className="bg-slate-50 text-indigo-700 border border-slate-100 text-[10px] h-5 px-2 hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                      {func.agent}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 border-slate-100 text-[10px] h-5 px-2">
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedFunction} onOpenChange={(open) => !open && setSelectedFunction(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFunction && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg ${selectedFunction.bgColor} flex items-center justify-center ${selectedFunction.color}`}>
                    <selectedFunction.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">{selectedFunction.title}</DialogTitle>
                    <DialogDescription className="text-base mt-1">
                      {selectedFunction.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Educational Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-500" />
                      Key Responsibilities
                    </h4>
                    <ul className="space-y-2">
                      {selectedFunction.details.responsibilities.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-500" />
                      Primary KPIs
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {selectedFunction.details.kpi}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="font-semibold text-sm text-slate-900 mb-1 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        Typical Team Size
                      </h4>
                      <p className="text-sm text-slate-600">{selectedFunction.details.teamSize}</p>
                    </div>
                  </div>
                </div>

                {/* Kevin's Solution */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-indigo-900">How Kevin Helps</h3>
                  </div>
                  <p className="text-indigo-800 leading-relaxed">
                    {selectedFunction.details.kevinHelps}
                  </p>

                  {selectedFunction.agentStatus === 'active' && (
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Try {selectedFunction.agent}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                  {selectedFunction.agentStatus === 'coming_soon' && (
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" variant="outline" disabled className="opacity-50">
                        Agent Coming Soon
                        <Clock className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
