/**
 * InnerFlame API Service
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createSupabaseClient } from '@innerflame/utils/supabase.js';
import { aiRouter, handleStreamRequest } from './routes/ai.js';
import { initTRPC } from '@trpc/server';
import { initSSE } from './controllers/sse.js';
import { SupabaseService } from './services/supabase/supabaseService.js';

// Load environment variables from the API directory with debug
const currentPath = path.resolve(process.cwd(), '.env');
const rootPath = path.resolve(process.cwd(), '../../.env');

// Try to load from the current directory first
let result = dotenv.config({ path: currentPath });

// If that fails, try loading from the root directory
if (result.error) {
  console.log('Could not find .env in the current directory, trying root directory...');
  result = dotenv.config({ path: rootPath });
}

if (result.error) {
  console.error('Error loading .env file:', result.error);
  console.log('Looked for .env files at:');
  console.log('- Current directory:', currentPath);
  console.log('- Root directory:', rootPath);
} else {
  console.log('Successfully loaded .env file');
}

// Debug environment variables
console.log('Environment loaded:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Found' : '✗ Missing');
console.log('- SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✓ Found' : '✗ Missing');
console.log('- CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✓ Found' : '✗ Missing');
console.log('- CLAUDE_MODEL:', process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307 (default)');
console.log('- CLAUDE_MAX_TOKENS:', process.env.CLAUDE_MAX_TOKENS || '1024 (default)');
console.log('- PORT:', process.env.PORT || '3001 (default)');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Parse comma-separated list of allowed origins with fallback to development defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

console.log('CORS allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

/**
 * Path normalization middleware
 * This middleware normalizes API paths by removing the `/api` prefix if present
 * This allows clients to use `/api/...` consistently while maintaining backward compatibility
 */
app.use((req, _, next) => {
  if (req.path.startsWith('/api/')) {
    // Keep the original URL for logging
    const originalUrl = req.url;

    // Update the URL by removing the /api prefix
    req.url = req.url.replace('/api', '');

    // Log the URL rewrite in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Path Normalizer] Rewriting ${originalUrl} to ${req.url}`);
    }
  }
  next();
});

// Initialize services
let supabaseConnectionOk = false;
try {
  // Initialize Supabase client but store it for later use
  const supabaseClient = createSupabaseClient();
  console.log('Supabase client initialized successfully');

  // Store in the shared service for access across the API
  SupabaseService.setClient(supabaseClient);

  // Also keep in app.locals for backward compatibility
  app.locals.supabase = supabaseClient;

  // Mark connection as OK
  supabaseConnectionOk = true;
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  process.exit(1); // Exit if Supabase initialization fails
}

// Create an API router
const t = initTRPC.create();
const appRouter = t.router({
  ai: aiRouter,
});

// Export type for client usage
export type AppRouter = typeof appRouter;

// tRPC API routes
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  })
);

// In-memory storage for stream sessions
const streamSessions = new Map();

// Enhanced health check endpoint
app.get('/health', async (_req, res) => {
  const startTime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // Check database connection
  let dbStatus = 'unknown';
  try {
    const supabase = SupabaseService.getClient();
    const { error } = await supabase.from('health_check').select('*').limit(1);

    if (error) {
      dbStatus = 'error';
      console.error('Health check - Database error:', error);
    } else {
      dbStatus = 'ok';
    }
  } catch (err) {
    dbStatus = 'error';
    console.error('Health check - Database check exception:', err);
  }

  res.json({
    status: 'ok',
    version: '0.1.0',
    uptime: startTime,
    timestamp: new Date().toISOString(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    },
    dependencies: {
      supabase: supabaseConnectionOk ? 'ok' : 'error',
      database: dbStatus,
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// AI streaming endpoints - defined WITHOUT the /api prefix
// The path normalization middleware will handle requests with the /api prefix

// SSE streaming endpoint - POST to initialize
app.post('/ai/stream', async (req, res) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  // Store the request data in the session
  streamSessions.set(sessionId, req.body);

  // Send a success response
  res.json({ success: true, message: 'Stream session initialized' });
});

// SSE streaming endpoint - GET for EventSource connection
app.get('/ai/stream', async (req, res) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  // Get the session data
  const sessionData = streamSessions.get(sessionId);

  if (!sessionData) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Initialize SSE connection
  initSSE(res);

  // Handle the streaming request with the session data
  await handleStreamRequest(
    {
      body: sessionData,
      app: req.app,
    } as any,
    res
  );
});

// Start server
try {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
    console.log(`tRPC endpoint available at: http://localhost:${PORT}/trpc`);
    console.log(`AI Stream endpoint available at: http://localhost:${PORT}/ai/stream`);
    console.log(`Path-normalized endpoint (also works): http://localhost:${PORT}/api/ai/stream`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
