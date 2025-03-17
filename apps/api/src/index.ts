/**
 * InnerFlame API Service
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createSupabaseClient } from '@innerflame/utils/supabase.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const supabase = createSupabaseClient();

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
}); 