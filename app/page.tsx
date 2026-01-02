"use client"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  Zap, 
  BarChart3, 
  Users, 
  FileText, 
  Shield,
  TrendingUp,
  Globe,
  ArrowRight,
  CheckCircle2
} from "lucide-react"
import { PLATFORMS } from "@/lib/constants/platforms"
import { useRef } from "react"

const features = [
  {
    icon: FileText,
    title: "Content Agent",
    description: "AI-powered content generation and multi-platform localization that speaks your brand's voice.",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100"
  },
  {
    icon: Users,
    title: "Leads Agent",
    description: "Smart lead scoring and automated follow-up suggestions to convert more prospects.",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100"
  },
  {
    icon: BarChart3,
    title: "Analytics Agent",
    description: "Unified cross-platform performance tracking and actionable insights in one dashboard.",
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-100"
  },
  {
    icon: TrendingUp,
    title: "Research Agent",
    description: "Real-time trend radar and competitor intelligence to keep you ahead of the curve.",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100"
  },
  {
    icon: Zap,
    title: "Campaign Agent",
    description: "End-to-end campaign builder with launch checklists and real-time ROI tracking.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-100"
  },
  {
    icon: Shield,
    title: "Brand Safety",
    description: "Automated content compliance and brand guidelines enforcement for peace of mind.",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-100"
  },
]

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
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export default function LandingPage() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
      {/* Hero Section */}
      <section ref={targetRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),rgba(255,255,255,0)_50%)]"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            style={{ opacity, scale, y }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div variants={itemVariants} className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-primary/10 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  AI Marketing Co-pilot
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
            >
              Meet{" "}
              <span className="relative inline-block">
                <span className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500 blur-2xl opacity-20"></span>
                <span className="relative bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Kevin
                </span>
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Your intelligent co-pilot for Chinese social media. 
              <span className="block mt-2 text-foreground font-medium">
                One person. Multiple roles. Infinite possibilities.
              </span>
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-7 h-auto rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-7 h-auto rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 border-primary/10"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Learn More
              </Button>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="mt-16 pt-8 border-t border-primary/5 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground"
            >
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-green-500" />
                 <span>2x Efficiency Boost</span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-green-500" />
                 <span>Multi-Platform Support</span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-green-500" />
                 <span>No Credit Card Required</span>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Platform Support */}
      <section className="py-24 bg-white/50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Manage All Your Platforms
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Kevin unifies your presence across the Chinese digital ecosystem
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {Object.values(PLATFORMS).map((platform, index) => (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{platform.icon}</div>
                  <div className="font-bold text-lg text-foreground mb-1">
                    {platform.name}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {platform.nameEn}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50/50 -skew-y-3 transform origin-top-left scale-110 z-0"></div>
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">
              Supercharge Your Workflow
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Six powerful agents working in harmony to amplify your marketing capabilities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} ${feature.borderColor} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-20"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
                Why Top Marketers Choose Kevin
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  title: "2x Efficiency",
                  description: "Compress 8-10 hours of manual work into 4-5 hours of strategic oversight.",
                  icon: Zap,
                  gradient: "from-yellow-400 to-orange-500"
                },
                {
                  title: "Multi-Role Support",
                  description: "Empower one person to handle content, analytics, and strategy seamlessly.",
                  icon: Users,
                  gradient: "from-blue-400 to-indigo-500"
                },
                {
                  title: "Language Bridge",
                  description: "Navigate Chinese social media nuances without needing native fluency.",
                  icon: Globe,
                  gradient: "from-green-400 to-emerald-500"
                },
              ].map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="text-center relative group"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mx-auto mb-6 text-white shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300`}>
                      <Icon className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed px-4">
                      {benefit.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]"></div>
        
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-[2.5rem] p-12 sm:p-20 shadow-2xl shadow-primary/25 relative overflow-hidden"
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight relative z-10">
              Ready to Transform Your Marketing?
            </h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto relative z-10 font-medium">
              Join the future of cross-border marketing. Start using Kevin today.
            </p>
            
            <div className="relative z-10">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="text-lg px-10 py-8 h-auto rounded-full bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">K</div>
              <span className="font-bold text-lg">Kevin</span>
            </div>
            <div className="text-center text-muted-foreground text-sm">
              <p>© 2026 Kevin - AI Marketing Co-pilot. All rights reserved.</p>
            </div>
            <div className="flex gap-6 text-muted-foreground">
               <a href="#" className="hover:text-primary transition-colors">Privacy</a>
               <a href="#" className="hover:text-primary transition-colors">Terms</a>
               <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
