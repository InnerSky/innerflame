// AI Service Entry Point
import { AIWebSocketServer } from './websocket/WebSocketServer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get port from environment or use default
const port = process.env.AI_SERVICE_PORT || 3002;

// Create and start WebSocket server instance
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
