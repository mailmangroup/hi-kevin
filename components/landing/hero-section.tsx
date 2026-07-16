"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, MessageSquare, BarChart3, Mail, CheckCircle2, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRef } from "react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function HeroSection() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50])

  return (
    <section ref={targetRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-32">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),rgba(255,255,255,0)_50%)]"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="container relative mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 z-10 max-w-[1400px]">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 xl:gap-20 items-center">
          <motion.div
            style={{ opacity, scale, y }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl lg:max-w-none mx-auto lg:mx-0 text-left"
          >
            <motion.div variants={itemVariants} className="mb-6 lg:mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-primary/10 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Meet Kevin 🤖
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-8 lg:mb-10 leading-[1.1]"
            >
              Your AI-Powered{" "}
              <span className="relative inline-block">
                <span className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500 blur-2xl opacity-20"></span>
                <span className="relative bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Marketing Team
                </span>
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-5 leading-relaxed"
            >
              Modern marketing requires <strong className="text-foreground">10 core disciplines</strong> and <strong className="text-foreground">100+ daily tasks</strong>. Stop trying to be a 10-person team.
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-10 lg:mb-12 leading-relaxed max-w-2xl"
            >
              <strong className="text-foreground">Kevin</strong> is your AI-powered marketing solution that automates the execution, so you can focus on strategy.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 items-start"
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="relative text-base lg:text-lg px-8 py-6 h-auto rounded-full overflow-hidden border-0 text-white font-semibold tracking-tight bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 shadow-[0_8px_30px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.45)] hover:from-indigo-500 hover:via-violet-500 hover:to-indigo-600 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_20px_rgba(99,102,241,0.3)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:content-['']"
                >
                  Hire Kevin
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="text-base lg:text-lg px-8 py-6 h-auto rounded-full bg-none bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 border-primary/10 dark:border-slate-700"
                onClick={() => {
                  document.getElementById("marketing-functions")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                See What He Can Do
              </Button>
            </motion.div>
          </motion.div>

          {/* Visual: Chat/Dashboard Interface */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="relative w-full max-w-[500px] lg:max-w-none mx-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
              {/* Window Controls */}
              <div className="h-10 bg-slate-800/50 flex items-center px-4 gap-2 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                <div className="ml-auto text-xs text-slate-500 font-medium">Kevin OS v2.0</div>
              </div>

              {/* Chat Interface */}
              <div className="p-5 lg:p-6 space-y-5 lg:space-y-6 min-h-[480px] lg:min-h-[520px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">

                {/* User Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 shadow-lg">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl rounded-tl-none p-4 max-w-[80%] border border-slate-700/50 shadow-xl">
                    <p className="text-slate-200 text-sm leading-relaxed">Kevin, I need to launch the Q3 Growth Campaign. Can you prepare the initial assets?</p>
                  </div>
                </motion.div>

                {/* Kevin Response */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex gap-4"
                >
                  <Image
                    src="/kevin-icon.svg"
                    alt="Kevin"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full shrink-0 shadow-lg shadow-primary/20"
                    unoptimized
                  />
                  <div className="space-y-4 max-w-[90%]">
                    <div className="bg-primary/5 backdrop-blur-sm rounded-2xl rounded-tr-none p-4 border border-primary/10 shadow-xl">
                      <p className="text-slate-200 text-sm mb-3 leading-relaxed">I&apos;m on it. I&apos;ve analyzed our competitor&apos;s recent moves and drafted the following assets for your approval:</p>

                      <div className="space-y-2">
                        {/* Task Item 1 */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.0 }}
                          className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800 hover:border-primary/30 transition-all group cursor-pointer hover:shadow-lg hover:shadow-primary/5"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-300">Email Sequence (5 Steps)</span>
                              <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" title="Co-Pilot Mode: Kevin drafts, You refine"></span>
                            </div>
                            <div className="text-[10px] text-slate-500">Drafted • Ready for review</div>
                          </div>
                          <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center group-hover:border-green-500 group-hover:bg-green-500/10 transition-colors">
                            <CheckCircle2 className="w-3 h-3 text-transparent group-hover:text-green-500 transition-colors" />
                          </div>
                        </motion.div>

                        {/* Task Item 2 */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.1 }}
                          className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800 hover:border-primary/30 transition-all group cursor-pointer hover:shadow-lg hover:shadow-primary/5"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/15 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-300">12 Social Media Posts</span>
                              <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" title="High Automation: Kevin owns it"></span>
                            </div>
                            <div className="text-[10px] text-slate-500">Scheduled for LinkedIn & Twitter</div>
                          </div>
                          <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center group-hover:border-green-500 group-hover:bg-green-500/10 transition-colors">
                            <CheckCircle2 className="w-3 h-3 text-transparent group-hover:text-green-500 transition-colors" />
                          </div>
                        </motion.div>

                        {/* Task Item 3 */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2 }}
                          className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800 hover:border-primary/30 transition-all group cursor-pointer hover:shadow-lg hover:shadow-primary/5"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 group-hover:bg-green-500/20 transition-colors">
                            <BarChart3 className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-300">ROI Projection Report</span>
                              <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" title="High Automation: Kevin owns it"></span>
                            </div>
                            <div className="text-[10px] text-slate-500">Based on historical CAC data</div>
                          </div>
                          <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center group-hover:border-green-500 group-hover:bg-green-500/10 transition-colors">
                            <CheckCircle2 className="w-3 h-3 text-transparent group-hover:text-green-500 transition-colors" />
                          </div>
                        </motion.div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 text-xs">
                          Approve All
                        </Button>
                        <Button size="sm" variant="outline" className="bg-none border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white h-8 text-xs">
                          Review Individually
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
