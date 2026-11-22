# AI setup fix, V3.2.1

The old "Quorail AI is not configured yet" message means the running server is missing at least one required setting. It occurs before a request is sent to Anthropic. It does not diagnose an empty Anthropic balance or invalid model.

In Vercel, open this project's Settings > Environment Variables. Ensure Production has ANTHROPIC_API_KEY with a real Anthropic API key, and a complete Redis REST pair:

- UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, or
- KV_REST_API_URL + KV_REST_API_TOKEN.

V3.2.1 supports both pairs and uses the complete Upstash pair first. Tokens from different prefixes are never mixed. Use the read/write REST token, not a read-only token or Redis TCP connection string. Custom-prefix variables must be copied into one of these supported pairs. Never prefix secrets with NEXT_PUBLIC_.

Save and redeploy after changing environment variables. Preview deployments need their own Preview-scoped settings. Keep ANTHROPIC_MODEL as claude-haiku-4-5-20251001 or another compatible model available to your account, and AI_DAILY_REQUEST_LIMIT=100 initially.

New errors distinguish a missing API key from missing request-limit storage without exposing secret values. Redis remains required to enforce request limits. This patch cannot create credentials or edit your Vercel account automatically. Do not share key values in screenshots or chat.
