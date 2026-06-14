# hi-kevin

- **Supabase 的 redirect URL 用 `/**` 通配**,比如 `http://localhost:3000/**`。换端口了就再加一条,旧的不会自动顶替。

- **Vercel 的环境变量在网站 Settings 里改,不是 `.env.local`**。而且改完不会自动生效,得重新 deploy 一次。
