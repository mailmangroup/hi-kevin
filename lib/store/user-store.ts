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
      const hasLocalEnv = process.env.KAWO_TOKEN && process.env.KAWO_ORG_ID && process.env.KAWO_BRAND_ID

      if (isDev && hasLocalEnv) {
        console.log('[UserStore] Using local environment credentials')
        set({
          profile: {
            full_name: 'Local Dev User',
            email: 'dev@local.com',
            kawo_token: process.env.KAWO_TOKEN,
            kawo_org_id: process.env.KAWO_ORG_ID,
            kawo_brand_id: process.env.KAWO_BRAND_ID,
            kawo_api_url: process.env.KAWO_API_URL
          },
          isLoading: false
        })
        return
      }

      // Production mode: fetch from Supabase
      console.log('[UserStore] Loading credentials from Supabase profile')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        set({ isLoading: false })
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, kawo_token, kawo_org_id, kawo_brand_id, kawo_api_url')
        .eq('id', user.id)
        .maybeSingle()

      if (data) {
        set({
          profile: {
            full_name: data.full_name,
            email: data.email || user.email || null,
            kawo_token: data.kawo_token,
            kawo_org_id: data.kawo_org_id,
            kawo_brand_id: data.kawo_brand_id,
            kawo_api_url: data.kawo_api_url
          }
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  setProfile: (profile) => set({ profile })
}))
