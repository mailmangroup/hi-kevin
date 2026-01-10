import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/proxy (proxy handles its own auth and needs to process large bodies)
     * But usually we want to protect everything except public assets.
     * Let's exclude images, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/proxy|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
