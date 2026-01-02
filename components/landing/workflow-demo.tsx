"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock, AlertCircle, CheckCircle2 } from "lucide-react"

const SCENARIOS = [
  {
    time: "09:00 AM",
    title: "Data Review",
    oldWay: {
      action: "Log into 4 platforms. Copy-paste into Excel. Fix formulas.",
      duration: "45 mins",
      stress: "High"
    },
    kevinWay: {
      message: "Morning. Douyin CPA is down 10%, but WeChat Leads dropped. Here is the unified dashboard.",
      duration: "2 mins",
      agent: "Analytics Agent"
    }
  },
  {
    time: "11:00 AM",
    title: "Content Creation",
    oldWay: {
      action: "Stare at blank screen. Write draft. Google keywords. Format manually.",
      duration: "2 hours",
      stress: "High"
    },
    kevinWay: {
      message: "Here are 3 variations for XiaoHongShu based on yesterday's topic. I've included high-traffic hashtags. Which one do you want to refine?",
      duration: "15 mins",
      agent: "Content Agent"
    }
  },
  {
    time: "04:00 PM",
    title: "Lead Nurturing",
    oldWay: {
      action: "Check CRM. Forget to follow up. Miss the window.",
      duration: "Lost Opportunity",
      stress: "Panic"
    },
    kevinWay: {
      message: "I've identified 5 Leads with a Score >80. I have already sent the 'Case Study' nurture email to 4 of them. One requires your personal reply (Draft ready).",
      duration: "Automated",
      agent: "Lead Agent"
    }
  }
]

export function WorkflowDemo() {
  return (
    <section className="py-24 bg-gradient-to-b from-white via-slate-50 to-indigo-50/30 overflow-hidden relative">
      {/* Modern ambient background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            <span>Time Saved</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
            Reclaim 5 Hours Every Day
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
            See the difference between manual execution and strategic orchestration with Kevin.
          </p>
        </div>

        <div className="grid gap-12 max-w-6xl mx-auto">
          {/* Header Row */}
          <div className="grid md:grid-cols-[180px_1.2fr_1fr] gap-8 items-center hidden md:grid">
            <div className="text-right text-sm font-bold tracking-wider text-slate-700 uppercase">Time</div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-xl px-6 py-4 border border-red-200/50">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold tracking-wider text-slate-700 uppercase">Manual Workflow</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-xl px-6 py-4 border border-green-200/50">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold tracking-wider text-slate-700 uppercase">With Kevin</span>
            </div>
          </div>

          {SCENARIOS.map((scenario, index) => (
            <div key={index} className="grid md:grid-cols-[180px_1.2fr_1fr] gap-8 items-stretch group">
              {/* Time Column */}
              <div className="text-slate-600 font-mono text-sm font-medium pt-8 md:text-right group-hover:text-slate-900 transition-colors flex items-start justify-end">
                {scenario.time}
              </div>

              {/* Old Way Column */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-8 relative overflow-hidden hover:border-red-300 hover:shadow-xl transition-all h-full"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-400 to-red-600"></div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg">{scenario.title}</h4>
                  </div>

                  <p className="text-slate-700 mb-6 leading-relaxed flex-grow">{scenario.oldWay.action}</p>

                  <div className="flex flex-wrap gap-3 mt-auto">
                    <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 px-3 py-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 mr-1.5" /> {scenario.oldWay.duration}
                    </Badge>
                    <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50 px-3 py-1.5 font-medium">
                      Stress: {scenario.oldWay.stress}
                    </Badge>
                  </div>
                </div>
              </motion.div>

              {/* Kevin Way Column */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.1 }}
                className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-2xl p-8 relative overflow-hidden hover:border-green-300 hover:shadow-xl transition-all h-full"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 to-emerald-600 shadow-lg shadow-green-500/20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent pointer-events-none"></div>

                <div className="flex flex-col h-full relative z-10">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0 border border-green-300 shadow-sm">
                        <MessageSquare className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg leading-tight">{scenario.kevinWay.agent}</h4>
                    </div>
                    <Badge className="bg-green-600 text-white hover:bg-green-700 border-0 shadow-sm shrink-0 mt-1">AI Active</Badge>
                  </div>

                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 mb-6 text-slate-700 text-sm border border-green-200/50 leading-relaxed shadow-sm flex-grow">
                    {scenario.kevinWay.message}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-auto">
                    <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 px-3 py-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 mr-1.5" /> {scenario.kevinWay.duration}
                    </Badge>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 px-3 py-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Complete
                    </Badge>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
