"use client"

import { CheckCircle2, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const SOPS = [
  "MQL to SQL Handoff Protocol",
  "Crisis Communication 5-Step Check",
  "Competitor Battle Card Update",
  "7-Day Lead Nurture Sequence",
  "CAC/LTV Real-time Calculation",
  "Social Media Content Calendar Template",
  "Influencer Outreach Scripts"
]

export function SopLibrary() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              <span>Built-in Expertise</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight text-slate-900 leading-tight">
              Pre-Trained on <span className="text-blue-600">Elite Marketing SOPs</span>.
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Kevin isn't just a generic LLM; he comes installed with the workflows of a Fortune 500 team.
              We've codified best practices into executable agents.
            </p>

            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-[80px] pointer-events-none -mr-32 -mt-32"></div>

              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 relative z-10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Installed Skills
              </h3>
              <div className="space-y-3 relative z-10">
                {SOPS.map((sop, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors border border-green-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{sop}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>

              <h3 className="text-2xl font-bold mb-2 relative z-10">Want to see the logic?</h3>
              <p className="text-slate-300 mb-8 relative z-10">
                Download the full "Marketing Operations Manual" that powers Kevin's brain.
              </p>

              <div className="relative z-10 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">The 10-Function Manual</h4>
                    <p className="text-sm text-slate-400">PDF • 45 Pages • v2.4</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-blue-500"></div>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden w-2/3">
                    <div className="h-full w-full bg-blue-500"></div>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden w-1/2">
                    <div className="h-full w-full bg-blue-500"></div>
                  </div>
                </div>
              </div>

              <Link href="/manual">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg shadow-lg shadow-blue-900/20 relative z-10">
                  <Download className="w-5 h-5 mr-2" />
                  Download Free Manual
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
