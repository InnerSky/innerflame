# InnerFlame Backend Environment Variables

This document lists all environment variables required for the InnerFlame backend service deployment.

## Required Environment Variables

| Variable Name | Description | Example Value | Required |
|---------------|-------------|--------------|----------|
| `NODE_ENV` | Application environment | `production` | Yes |
| `PORT` | Port number for the API server | `8080` | Yes |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS | `https://example.com,https://www.example.com` | No (defaults to localhost URLs) |
| `SUPABASE_URL` | URL for the Supabase instance | `https://xyz.supabase.co` | Yes |
| `SUPABASE_KEY` | Service role key for Supabase | `eyJh...` | Yes |
| `CLAUDE_API_KEY` | API key for Claude AI | `sk-ant-api...` | Yes |
| `CLAUDE_MODEL` | Model version for Claude AI | `claude-3-haiku-20240307` | No (defaults to claude-3-haiku-20240307) |
| `CLAUDE_MAX_TOKENS` | Maximum tokens for Claude responses | `1024` | No (defaults to 1024) |

## Configuring Environment Variables in Google Cloud Run

These variables are set during deployment using the `--set-env-vars` flag in the Cloud Run deployment command:

```bash
gcloud run deploy innerflame-api \
  --image gcr.io/YOUR_PROJECT_ID/innerflame-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "PORT=8080" \
  --set-env-vars "SUPABASE_URL=YOUR_SUPABASE_URL" \
  --set-env-vars "SUPABASE_KEY=YOUR_SUPABASE_KEY" \
  --set-env-vars "CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY" \
  --set-env-vars "CLAUDE_MODEL=claude-3-haiku-20240307" \
  --set-env-vars "CLAUDE_MAX_TOKENS=1024"
```

## Security Recommendations

For production deployments, it's recommended to store sensitive values (API keys, secrets) using Google Cloud Secret Manager:

1. Create secrets in Secret Manager:
   ```bash
   gcloud secrets create SUPABASE_KEY --data-file=/path/to/supabase_key.txt
   ```

2. Reference the secrets in Cloud Run:
   ```bash
   gcloud run deploy innerflame-api \
     --image gcr.io/YOUR_PROJECT_ID/innerflame-api \
     --set-secrets SUPABASE_KEY=SUPABASE_KEY:latest
   ```

## Development vs. Production

In development, environment variables are loaded from the `.env` file in the project root. In production, they are provided by the Cloud Run service configuration. 