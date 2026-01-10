import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  full_name: string | null
  email: string | null
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
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        set({ isLoading: false })
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()

      if (data) {
        set({ 
          profile: {
            full_name: data.full_name,
            email: data.email || user.email || null
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
