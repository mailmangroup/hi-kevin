import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  full_name: string | null
  email: string | null
  kawo_token?: string | null
  kawo_org_id?: string | null
  kawo_brand_id?: string | null
  kawo_api_url?: string | null
}

interface UserStore {
  profile: UserProfile | null
  isLoading: boolean
  fetchProfile: () => Promise<void>
  setProfile: (profile: UserProfile) => void
  clearProfile: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  isLoading: false,
  fetchProfile: async () => {
    // If already loading or profile exists, skip to avoid duplicate requests
    if (get().isLoading || get().profile) return

    set({ isLoading: true })
    try {
      // In development mode with local env vars, ALWAYS use local env instead of Supabase
      const isDev = process.env.NODE_ENV === 'development'
      // Check both standard and NEXT_PUBLIC_ variants
      const token = process.env.KAWO_TOKEN || process.env.NEXT_PUBLIC_KAWO_TOKEN
      const orgId = process.env.KAWO_ORG_ID || process.env.NEXT_PUBLIC_KAWO_ORG_ID
      const brandId = process.env.KAWO_BRAND_ID || process.env.NEXT_PUBLIC_KAWO_BRAND_ID
      const apiUrl = process.env.KAWO_API_URL || process.env.NEXT_PUBLIC_KAWO_API_URL
      
      const hasLocalEnv = token && orgId && brandId

      if (isDev && hasLocalEnv) {
        set({
          profile: {
            full_name: process.env.NEXT_PUBLIC_DEV_USER_NAME || 'Developer',
            email: process.env.NEXT_PUBLIC_DEV_USER_EMAIL || 'dev@localhost',
            kawo_token: token,
            kawo_org_id: orgId,
            kawo_brand_id: brandId,
            kawo_api_url: apiUrl
          },
          isLoading: false
        })
        return
      }

      // Production mode: fetch from Supabase
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        set({ isLoading: false })
        return
      }

      // Display name lives on `profiles`; KAWO context lives on the
      // owner-only `user_kawo_credentials` table (kept off `profiles` so the
      // team-readable profile rows don't leak each user's API token).
      const [{ data: profile }, { data: creds }] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('user_kawo_credentials')
          .select('kawo_token, kawo_org_id, kawo_brand_id, kawo_api_url')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      if (profile || creds) {
        set({
          profile: {
            full_name: profile?.name ?? null,
            email: profile?.email || user.email || null,
            kawo_token: creds?.kawo_token ?? null,
            kawo_org_id: creds?.kawo_org_id ?? null,
            kawo_brand_id: creds?.kawo_brand_id ?? null,
            kawo_api_url: creds?.kawo_api_url ?? null
          }
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null, isLoading: false })
}))
