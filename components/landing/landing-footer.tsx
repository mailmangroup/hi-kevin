"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
            Stop drowning in operations.
            <br />
            <span className="text-primary">Start leading the strategy.</span>
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            Hire a 6-Agent Team for less than the cost of one intern.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto text-lg px-10 py-6 h-auto rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                Deploy Kevin Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8 pt-12 border-t border-slate-800 text-sm text-slate-400">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/kevin-icon.svg"
                alt="Kevin"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg shadow-sm"
                unoptimized
              />
              <span className="font-bold text-lg text-white tracking-tight">Kevin</span>
            </div>
            <p className="max-w-xs">
              The Autonomous Marketing Operating System.
              Helping one-person teams do the work of ten.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">Agents</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 Kevin Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
