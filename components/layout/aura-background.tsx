"use client"

import { useEffect, useState } from "react"

export function AuraBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none select-none overflow-hidden">
      {/* Primary Orb 1: Top Left (behind header/sidebar) - Violet */}
      <div
        className="absolute top-[-15%] left-[-15%] w-[500px] h-[500px] rounded-full bg-violet-300 opacity-30 blur-[120px]"
      />

      {/* Primary Orb 2: Bottom Right - Indigo */}
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-300 opacity-25 blur-[120px]"
      />

      {/* Primary Orb 3: Top Right/Center - Purple */}
      <div
        className="absolute top-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-300 opacity-25 blur-[100px]"
      />

      {/* Secondary Orb 4: Middle Left - Blue */}
      <div
        className="absolute top-[40%] left-[5%] w-[350px] h-[350px] rounded-full bg-blue-200 opacity-20 blur-[80px]"
      />

      {/* Secondary Orb 5: Center - Soft Violet */}
      <div
        className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-violet-200 opacity-15 blur-[100px]"
      />

      {/* Accent Orb 6: Bottom Left - Indigo */}
      <div
        className="absolute bottom-[20%] left-[15%] w-[300px] h-[300px] rounded-full bg-indigo-200 opacity-18 blur-[90px]"
      />

      {/* Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  )
}
