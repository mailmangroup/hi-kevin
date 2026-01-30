"use client"

import { useEffect } from "react"
import { useUserStore } from "@/lib/store/user-store"

export function UserStoreProvider({ children }: { children: React.ReactNode }) {
  const fetchProfile = useUserStore((state) => state.fetchProfile)

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return <>{children}</>
}
