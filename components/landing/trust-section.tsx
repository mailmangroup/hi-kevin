"use client"

import { Shield, Lock, CheckCircle } from "lucide-react"
import { PLATFORMS } from "@/lib/constants/platforms"

export function TrustSection() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Enterprise Security</h3>
            <p className="text-slate-600 leading-relaxed">Enterprise-grade encryption. Your data never trains public models.</p>
          </div>
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Brand Safe</h3>
            <p className="text-slate-600 leading-relaxed">Kevin never publishes without your final 'Go' signal on critical tasks.</p>
          </div>
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Verified SOPs</h3>
            <p className="text-slate-600 leading-relaxed">Workflows designed by expert marketers, not just engineers.</p>
          </div>
        </div>

        <div className="text-center">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">
            Seamless Integration With
          </h4>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* We would normally map through platform logos here. Using text for now as placeholders or simple icons */}
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-500 rounded-lg"></span> WeChat
            </div>
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-black rounded-lg"></span> Douyin
            </div>
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-500 rounded-lg"></span> XiaoHongShu
            </div>
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-500 rounded-lg"></span> Salesforce
            </div>
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 rounded-lg"></span> HubSpot
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
