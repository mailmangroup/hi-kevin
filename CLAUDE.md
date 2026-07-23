# hi-kevin

Next.js 14 (App Router) frontend for Kevin, an AI Marketing Co-pilot. Talks directly to an external Python FastAPI (KAWO) backend. Auth is Supabase on the frontend; API calls inject KAWO Bearer + org/brand headers.

## Gotchas

- **Supabase redirect URL 用 `/**` 通配**,比如 `http://localhost:3000/**`。换端口了就再加一条,旧的不会自动顶替。
- **Vercel 的环境变量在网站 Settings 里改,不是 `.env.local`**。改完不会自动生效,得重新 deploy 一次。
- **KAWO 凭证只放 owner-only 的 `user_kawo_credentials`**,不要放共享的 `profiles`。API URL 留空时必须回退到 `DEFAULT_KAWO_API_URL`。
- **登录不是单一路径**:普通用户走 Google OAuth；只有 `tech@kawo.com` 可以用密码登录。
- **Vercel 不要配 `NEXT_PUBLIC_KAWO_*`**。生产凭证按用户存在 Supabase；本地才用 `.env.local` 里的 KAWO 变量。

## Stack

- Next.js 14 App Router, TypeScript, Tailwind + shadcn/ui
- TanStack Query (server state) + Zustand (client UI state)
- Supabase auth/user data; Recharts; React Hook Form + Zod; next-intl

## Layout

```
app/(dashboard)/     # dashboard + chat pages
app/login/           # auth
components/          # feature folders (analytics, chat, content, leads, …) + ui/
lib/api/             # API clients (Analytics, Frost, Chat)
lib/hooks/ lib/mock/ lib/supabase/ lib/utils/
types/
```

## KAWO credentials

| Env | Source |
|-----|--------|
| Local (`NODE_ENV=development`) | `.env.local`: `NEXT_PUBLIC_KAWO_TOKEN`, `ORG_ID`, `BRAND_ID`; optional `API_URL` → `DEFAULT_KAWO_API_URL` |
| Production | Supabase `user_kawo_credentials` (`kawo_token`, `kawo_org_id`, `kawo_brand_id`, `kawo_api_url`); blank URL → `DEFAULT_KAWO_API_URL` |

Request flow: Supabase login → load credentials (dev env vs prod table) → browser calls KAWO API URL with Bearer + `X-KAWO-Org-Id` / `X-KAWO-Brand-Id`.

## Mock mode

- `lib/api/client.ts` uses `USE_MOCK` from `NEXT_PUBLIC_USE_MOCK` / `NEXT_PUBLIC_FORCE_MOCK`.
- Mock on → return fixture data; mock off → real KAWO calls (needs local KAWO env vars).

## Env (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_FORCE_MOCK=false
# local only when mock is off — never set on Vercel
NEXT_PUBLIC_KAWO_TOKEN=
NEXT_PUBLIC_KAWO_ORG_ID=
NEXT_PUBLIC_KAWO_BRAND_ID=
NEXT_PUBLIC_KAWO_API_URL=http://localhost:8005
```

## API integration status

| Area | Status | Notes |
|------|--------|-------|
| Content `generateContent` | ✅ | `POST /content/write` |
| Content localize / compliance | 🟡 | mock fallback |
| Frost dashboard / leads / search | ✅ | `/frost/...` |
| Follow-up / report gen | 🟡 | mock fallback |
| Analytics dashboard | ✅ | `GET /analytics/dashboard` |
| Chat stream + deep agent + artifacts | ✅ | `POST /agent/query` (SSE) |
| Conversations / messages / reports | ✅ | `/agent/...` |
| Dashboard aggregate | 🔴 | mock only |

Chat details: [docs/chat-architecture.md](./docs/chat-architecture.md).

## External backend (separate repo)

MongoDB (ops data), PostgreSQL/pgvector (RAG), LangChain/LLM orchestration.
