"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { BarChart3, Edit3, Target, Search, Calendar, Shield, CheckCircle2, ArrowRight } from "lucide-react"

const AGENTS = [
  {
    name: "Data & Analytics",
    role: "Unified Intelligence",
    icon: BarChart3,
    description: "Connects to Douyin, WeChat, & CRM to provide a single source of truth.",
    workflows: [
      "Automatically generates weekly ROI reports",
      "Detects CPA anomalies in real-time",
      "Flags underperforming campaigns for budget optimization"
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100"
  },
  {
    name: "Content Creator",
    role: "Multi-Channel Production",
    icon: Edit3,
    description: "Turns one core idea into platform-native posts for every channel.",
    workflows: [
      "Drafts XiaoHongShu posts with trending hashtags",
      "Formats articles for WeChat Official Accounts",
      "Adapts sales decks for local partners"
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100"
  },
  {
    name: "Lead & CRM",
    role: "24/7 Pipeline Guard",
    icon: Target,
    description: "Ensures no lead is left behind by automating the qualification process.",
    workflows: [
      "Scores incoming leads based on fit and activity",
      "Triggers personalized nurture sequences",
      "Alerts you immediately when a hot lead is ready to close"
    ],
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-100"
  },
  {
    name: "Research & Intel",
    role: "Market Watchtower",
    icon: Search,
    description: "Monitors the market 24/7 so you never miss a competitor move.",
    workflows: [
      "Tracks competitor pricing and ad campaigns",
      "Monitors user sentiment on social platforms",
      "Updates 'Battle Cards' with new objection handlers"
    ],
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100"
  },
  {
    name: "Campaign Exec",
    role: "Project Command",
    icon: Calendar,
    description: "Manages the logistics and timeline of your complex marketing calendar.",
    workflows: [
      "Tracks campaign milestones and deadlines",
      "Coordinates logistics for offline events",
      "Handles pre-event invites and post-event follow-ups"
    ],
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-100"
  },
  {
    name: "Brand Safety",
    role: "Compliance Shield",
    icon: Shield,
    description: "Protects your brand reputation by enforcing guidelines automatically.",
    workflows: [
      "Reviews content against China Ad Law (banned words)",
      "Checks visual assets for brand consistency",
      "Flags potential PR risks before publishing"
    ],
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-100"
  },
]

export function AgentMatrix() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>One System. 6 Agents. Complete Coverage.</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent"
          >
            Specialized Agents for Every Function.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed"
          >
            The <strong className="text-slate-900">10 Core Functions</strong> you just saw? Kevin's 6 specialized agents work together to handle them all—automating execution so you can focus on strategy.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {AGENTS.map((agent, index) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full ${agent.bgColor.replace('bg-', 'bg-gradient-to-b from-') + '-400 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl ${agent.bgColor} flex items-center justify-center ${agent.color} border ${agent.borderColor} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <agent.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900 group-hover:text-indigo-900 transition-colors">{agent.name}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{agent.role}</p>
                </div>
              </div>

              <p className="text-slate-600 mb-8 leading-relaxed text-base flex-grow">
                {agent.description}
              </p>

              <div className="mt-auto bg-slate-50/80 rounded-xl p-5 border border-slate-100 group-hover:border-indigo-100 transition-colors">
                <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-slate-400" />
                  Key Workflows
                </h4>
                <ul className="space-y-3">
                  {agent.workflows.map((workflow, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${agent.color.replace('text-', 'bg-')}`} />
                      {workflow}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
