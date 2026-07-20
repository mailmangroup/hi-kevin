# hi-kevin

- **Supabase 的 redirect URL 用 `/**` 通配**,比如 `http://localhost:3000/**`。换端口了就再加一条,旧的不会自动顶替。

- **Vercel 的环境变量在网站 Settings 里改,不是 `.env.local`**。而且改完不会自动生效,得重新 deploy 一次。

- **KAWO 凭证只放 owner-only 的 `user_kawo_credentials`**,不要放共享的 `profiles`。API URL 留空时必须回退到 `DEFAULT_KAWO_API_URL`。

- **登录不是单一路径**:普通用户走 Google OAuth；只有 `tech@kawo.com` 可以用密码登录。
