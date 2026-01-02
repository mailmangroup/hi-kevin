"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, FileText } from "lucide-react"
import Link from "next/link"

export function ManualContent() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Kevin
          </Button>
        </Link>
        <Button size="sm">
          <Download className="mr-2 w-4 h-4" />
          Download PDF
        </Button>
      </div>

      <article className="prose prose-slate max-w-none lg:prose-lg dark:prose-invert bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 pb-8 mb-8">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <FileText className="w-4 h-4" />
              <span>Official Kevin Manual v2.4</span>
            </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Marketing Team 完整运营手册：从组织架构到日常执行
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            现代 Marketing 部门平均投入 <strong>公司收入的 7.7%</strong> 作为预算（Gartner 2025），其运营涵盖 10+ 个子职能、30+ 种工具、100+ 项日常任务。本报告基于 HubSpot、Salesforce、Product Marketing Alliance 等权威来源，提供完整的职能架构、工作流程、SOP 模板和实际执行指南。
          </p>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6">一、Marketing Team 完整职能架构</h2>
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">十大核心子职能及其 KPI</h3>
        <p className="text-slate-600 mb-4">一个成熟的 Marketing 部门通常包含以下子职能，每个都有明确的职责边界和考核指标：</p>
        
        <div className="overflow-x-auto my-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 font-semibold text-slate-900">子职能</th>
                <th className="p-4 font-semibold text-slate-900">核心职责</th>
                <th className="p-4 font-semibold text-slate-900">主要 KPI</th>
                <th className="p-4 font-semibold text-slate-900">典型团队规模</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-4 font-medium text-slate-900">Demand Generation</td>
                <td className="p-4 text-slate-600">多渠道获客、pipeline 贡献</td>
                <td className="p-4 text-slate-600">MQL 数量、SQL 转化率</td>
                <td className="p-4 text-slate-600">3-5 人</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-900">Product Marketing</td>
                <td className="p-4 text-slate-600">产品定位、GTM 策略</td>
                <td className="p-4 text-slate-600">产品收入、Win Rate</td>
                <td className="p-4 text-slate-600">2-4 人</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-900">Content Marketing</td>
                <td className="p-4 text-slate-600">内容生产、SEO</td>
                <td className="p-4 text-slate-600">有机流量、转化率</td>
                <td className="p-4 text-slate-600">2-4 人</td>
              </tr>
               <tr>
                <td className="p-4 font-medium text-slate-900">Marketing Operations</td>
                <td className="p-4 text-slate-600">技术栈、数据管理</td>
                <td className="p-4 text-slate-600">数据准确率、ROI</td>
                <td className="p-4 text-slate-600">2-4 人</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6">二、Lead Generation & Nurturing 完整流程</h2>
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">完整 Lead 漏斗 10 阶段</h3>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-mono text-sm text-slate-700 mb-6">
          Lead Capture → Enrichment → Scoring → Routing → Scheduling → Discovery Call → Nurture → Demo → Negotiation → Customer
        </div>

        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">Lead Scoring 模型实例</h3>
        <div className="grid md:grid-cols-2 gap-8 my-6">
          <div>
            <h4 className="font-bold text-slate-900 mb-3">Fit Score（账户维度）</h4>
            <ul className="space-y-2 text-slate-600">
              <li className="flex justify-between"><span>员工数 1000+</span> <span className="font-mono text-green-600">+50</span></li>
              <li className="flex justify-between"><span>目标行业</span> <span className="font-mono text-green-600">+30</span></li>
              <li className="flex justify-between"><span>C-level 职位</span> <span className="font-mono text-green-600">+30</span></li>
              <li className="flex justify-between"><span>实习生</span> <span className="font-mono text-red-500">-10</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-3">Behavior Score（行为维度）</h4>
            <ul className="space-y-2 text-slate-600">
              <li className="flex justify-between"><span>访问定价页</span> <span className="font-mono text-green-600">+30</span></li>
              <li className="flex justify-between"><span>下载白皮书</span> <span className="font-mono text-green-600">+30</span></li>
              <li className="flex justify-between"><span>Demo 申请</span> <span className="font-mono text-green-600">+50</span></li>
              <li className="flex justify-between"><span>邮件点击</span> <span className="font-mono text-green-600">+10</span></li>
            </ul>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6">三、Solo Marketer 的黄金法则</h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-6">
          <ul className="space-y-4 text-slate-700">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">1.</span>
              <span>选择一个最重要的指标并首先专注于此。</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">2.</span>
              <span>自动化重复工作（报告、排期、邮件序列）。</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">3.</span>
              <span>外包消耗精力的工作——即使几小时 freelance 也有帮助。</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">4.</span>
              <span>建立一件不依赖你运作的东西——一篇排名的博客、一个转化的邮件序列。</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">5.</span>
              <span>严格保护时间——burnout 不会让妳成为英雄。</span>
            </li>
          </ul>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-500 mb-6">这只是完整手册的 10% 内容。下载完整版 PDF 以获取所有 10 个职能的详细 SOP。</p>
          <Button size="lg" className="w-full sm:w-auto">
            <Download className="mr-2 w-5 h-5" />
            下载完整 45 页 PDF
          </Button>
        </div>
      </article>
    </div>
  )
}
