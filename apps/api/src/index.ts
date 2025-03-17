/**
 * InnerFlame API Service
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createSupabaseClient } from '@innerflame/utils/supabase.js';

// Load environment variables from the API directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug environment variables
console.log('Environment loaded:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Found' : '✗ Missing');
console.log('- SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✓ Found' : '✗ Missing');
console.log('- PORT:', process.env.PORT || '3001 (default)');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
try {
  const supabase = createSupabaseClient();
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  process.exit(1); // Exit if Supabase initialization fails
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// Start server
try {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 