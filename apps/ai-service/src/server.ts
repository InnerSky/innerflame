// AI Service Entry Point
import { AIWebSocketServer } from './websocket/WebSocketServer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables with fallbacks for various potential locations
// Try to load from the local directory first
dotenv.config();

// Additionally try to load from app root directory
const appRootPath = path.resolve(__dirname, '..');
if (fs.existsSync(path.join(appRootPath, '.env'))) {
  dotenv.config({ path: path.join(appRootPath, '.env') });
}

// Debug environment loading
console.log('Environment loading debug:');
console.log('- VITE_SUPABASE_URL exists:', !!process.env.VITE_SUPABASE_URL);
console.log('- VITE_SUPABASE_ANON_KEY exists:', !!process.env.VITE_SUPABASE_ANON_KEY);

// Get port from environment or use default
const port = process.env.AI_SERVICE_PORT || 3001; // Using standard port 3001

// Create and start WebSocket server instance
console.log(`Starting WebSocket server on port ${port}...`);
const server = new AIWebSocketServer(Number(port));

// Handle graceful shutdown
const handleShutdown = () => {
  console.log('Shutdown signal received, closing server...');
  server.shutdown();
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

console.log(`AI Service started on port ${port}`);
