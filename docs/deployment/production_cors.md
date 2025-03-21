# CORS Configuration for Production

This document explains how to properly configure Cross-Origin Resource Sharing (CORS) for the InnerFlame API in production.

## Current CORS Configuration

In the development environment, CORS is currently configured to allow requests from local development servers:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
```

## Production CORS Configuration

For production, you need to update the CORS configuration to allow requests from your production frontend domain.

### Option 1: Update the Code Directly

Edit `apps/api/src/index.ts` to include your production domain:

```javascript
// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://your-production-domain.com', 'https://www.your-production-domain.com']
  : ['http://localhost:5173', 'http://localhost:3000'];

// Configure CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Option 2: Use Environment Variables

A more flexible approach is to use environment variables:

```javascript
// Parse comma-separated list of allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

// Configure CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Then add the `ALLOWED_ORIGINS` to your Cloud Run deployment command:

```bash
gcloud run deploy innerflame-api \
  --image gcr.io/YOUR_PROJECT_ID/innerflame-api \
  --set-env-vars "ALLOWED_ORIGINS=https://your-production-domain.com,https://www.your-production-domain.com"
```

## Testing CORS Configuration

To test that CORS is correctly configured:

1. Deploy your backend with the updated CORS configuration
2. Deploy your frontend to your production domain
3. Open your browser's developer tools and check for CORS errors in the Console
4. Make API requests from your frontend and verify they succeed
5. Check the Network tab in developer tools to confirm CORS headers are properly set

## Security Considerations

- Only add domains you control to the allowed origins
- Consider adding rate limiting if your API is exposed publicly
- Regularly audit your CORS configuration to ensure it's not overly permissive
- Be cautious with `credentials: true` as it allows cookies to be sent cross-origin 