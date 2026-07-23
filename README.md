# Kevin - AI Marketing Co-pilot

Kevin helps solo marketers run analytics, content, leads, and campaigns from one AI co-pilot.

This repo is the **Next.js frontend**. It talks to a separate Python FastAPI (KAWO) backend. Auth is Supabase.

Agent/architecture notes (credentials, mock mode, API status): see [CLAUDE.md](./CLAUDE.md).

## Getting Started

**Prerequisites:** Node.js 18+, npm or yarn.

```bash
make help      # list commands
make install
make dev       # or: npm install && npm run dev
make build
make start
make lint
make clean
```

## Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_FORCE_MOCK=false

# Local only when mock is off — do not set on Vercel
NEXT_PUBLIC_KAWO_TOKEN=your_kawo_token
NEXT_PUBLIC_KAWO_ORG_ID=your_kawo_org_id
NEXT_PUBLIC_KAWO_BRAND_ID=your_kawo_brand_id
NEXT_PUBLIC_KAWO_API_URL=http://localhost:8005
```

Vercel env vars live in project Settings (not `.env.local`) and need a redeploy to apply. Do not put `NEXT_PUBLIC_KAWO_*` on Vercel — production credentials come from Supabase per user.
