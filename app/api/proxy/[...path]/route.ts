import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configure route segment config for larger payloads
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds timeout
// Note: Body size limits are controlled at the platform level (Vercel has 4.5MB limit on Hobby, 100MB on Pro)

// Handle GET, POST, PUT, DELETE, etc.
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path)
}

async function handleProxy(request: NextRequest, pathSegments: string[]) {
  console.log('[Proxy] Starting handleProxy for path:', pathSegments.join('/'))

  // 1. Check Authentication
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log('[Proxy] Auth check:', { userId: user?.id, authError })

  let token: string | null = null
  let orgId: string | null = null
  let brandId: string | null = null
  let apiUrl: string | null = null

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // 2. Fetch Profile & Credentials
  console.log('[Proxy] Fetching profile for user:', user.id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('kawo_token, kawo_org_id, kawo_brand_id, kawo_api_url')
    .eq('id', user.id)
    .maybeSingle()

  console.log('[Proxy] Profile result:', { profile: profile ? 'exists' : 'null', profileError })

  if (profileError) {
    console.error('[Proxy] Profile fetch error:', profileError)
    return NextResponse.json(
      { error: 'Failed to load profile', code: 'PROFILE_FETCH_FAILED' },
      { status: 500 }
    )
  }

  // Check if credentials configured
  if (!profile || !profile.kawo_token || !profile.kawo_org_id || !profile.kawo_brand_id) {
    return NextResponse.json(
      { 
        error: 'KAWO credentials not configured. Please complete setup.', 
        code: 'CREDENTIALS_MISSING'
      },
      { status: 403 }
    )
  }

  token = profile.kawo_token
  orgId = profile.kawo_org_id
  brandId = profile.kawo_brand_id
  apiUrl = profile.kawo_api_url || process.env.KAWO_API_URL

  if (!apiUrl) {
    return NextResponse.json(
      { 
        error: 'KAWO API URL not configured. Please set kawo_api_url in profile or KAWO_API_URL environment variable.',
        code: 'API_URL_MISSING'
      },
      { status: 500 }
    )
  }

  // 3. Construct Target URL
  const path = pathSegments.join('/')
  const baseUrl = apiUrl
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/${path}${request.nextUrl.search}`

  // 4. Prepare Headers
  const headers = new Headers(request.headers)
  
  // Remove host to avoid confusion
  headers.delete('host')
  headers.delete('connection')

  // Use user-specific credentials
  headers.set('Authorization', `Bearer ${token}`)
  if (orgId) headers.set('X-KAWO-Org-Id', orgId)
  if (brandId) headers.set('X-KAWO-Brand-Id', brandId)

  // 4. Forward Request
  try {
    let body = null
    const isChatQuery = pathSegments.join('/') === 'agent/query' && request.method === 'POST'

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (isChatQuery) {
        const json = await request.json()
        
        // Dynamic model selection based on images
        if (json.images && json.images.length > 0) {
          if (json.model === 'qwen-max') {
            json.model = 'qwen-vl-max'
          } else if (json.model === 'qwen-plus') {
            json.model = 'qwen3-vl-plus'
          }
        }
        
        body = JSON.stringify(json)
      } else {
        body = await request.blob()
      }
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      // @ts-ignore
      duplex: 'half', // Required for streaming bodies in some Next.js versions/Node
    })

    // Log errors for debugging
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend API Error:', {
        url: targetUrl,
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })

      // Return the error response
      return new NextResponse(errorText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }

    // 5. Return Response
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })

  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json(
      { error: 'Failed to communicate with backend' }, 
      { status: 502 }
    )
  }
}
