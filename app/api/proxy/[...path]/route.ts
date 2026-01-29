import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configure route segment config for larger payloads
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds timeout
export const dynamic = 'force-dynamic' // Disable caching for all requests
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
  // Use getSession to avoid extra calls to auth/v1/user
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  const user = session?.user

  console.log('[Proxy] Auth check:', { userId: user?.id, authError })

  let token: string | null = null
  let orgId: string | null = null
  let brandId: string | null = null
  let apiUrl: string | null = null

  // Check if we can use local dev env vars (no Supabase auth needed)
  const hasEnvCredentials = process.env.KAWO_TOKEN && process.env.KAWO_ORG_ID && process.env.KAWO_BRAND_ID

  if (!user && !hasEnvCredentials) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (hasEnvCredentials) {
    // Local dev mode: use env vars directly, skip profile fetch
    console.log('[Proxy] Using local environment variables for credentials')
    token = process.env.KAWO_TOKEN || null
    orgId = process.env.KAWO_ORG_ID || null
    brandId = process.env.KAWO_BRAND_ID || null
    apiUrl = process.env.KAWO_API_URL || null
  } else {
    // Production mode: fetch credentials from user profile
    console.log('[Proxy] Fetching profile for user:', user!.id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kawo_token, kawo_org_id, kawo_brand_id, kawo_api_url')
      .eq('id', user!.id)
      .maybeSingle()

    console.log('[Proxy] Profile result:', { profile: profile ? 'exists' : 'null', profileError })

    if (profileError) {
      console.error('[Proxy] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to load profile', code: 'PROFILE_FETCH_FAILED' },
        { status: 500 }
      )
    }

    if (profile) {
      token = profile.kawo_token
      orgId = profile.kawo_org_id
      brandId = profile.kawo_brand_id
      apiUrl = profile.kawo_api_url || process.env.KAWO_API_URL || null
    }
  }

  // Check if credentials configured
  if (!token || !orgId || !brandId) {
    return NextResponse.json(
      { 
        error: 'KAWO credentials not configured. Please complete setup.', 
        code: 'CREDENTIALS_MISSING'
      },
      { status: 403 }
    )
  }

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

  // Remove headers that should not be forwarded
  headers.delete('host')
  headers.delete('connection')
  headers.delete('content-length') // Will be recalculated by fetch()

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
        let json
        try {
          json = await request.json()
          console.log('[API] Successfully parsed JSON payload')
        } catch (jsonError) {
          console.error('[API] Failed to parse JSON:', jsonError)
          return NextResponse.json(
            { error: 'Failed to parse request body. Payload may be too large or malformed.', details: String(jsonError) },
            { status: 400 }
          )
        }

        // Inject credentials into body if missing (e.g. when using env vars in dev mode)
          if (!json.org_id && orgId) {
            console.log('[API] Injecting org_id into request body')
            json.org_id = orgId
          }
          if (!json.brand_id && brandId) {
            console.log('[API] Injecting brand_id into request body')
            json.brand_id = brandId
          }

          console.log('[API] Sending chat query payload:', {
            query: json.query?.substring(0, 100),
            hasImages: !!json.images,
            imageCount: json.images?.length || 0,
            model: json.model,
            org_id: json.org_id,
            brand_id: json.brand_id
          })

        // Dynamic model selection based on images
        if (json.images && json.images.length > 0) {
          console.log('[API] Images detected, switching model:', {
            from: json.model,
            to: json.model === 'qwen-max' ? 'qwen-vl-max' : (json.model === 'qwen-plus' ? 'qwen3-vl-plus' : json.model)
          })
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

    console.log('[API] Forwarding request to:', {
      url: targetUrl,
      method: request.method,
      hasBody: !!body,
      bodySize: body ? (typeof body === 'string' ? body.length : body.size) : 0
    })

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      // @ts-ignore
      duplex: 'half', // Required for streaming bodies in some Next.js versions/Node
    })

    console.log('[API] Backend response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
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
