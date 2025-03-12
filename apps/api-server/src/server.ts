// API Server entry point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes once created
// import entityRoutes from './routes/entityRoutes';
// import authRoutes from './routes/authRoutes';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Route handler placeholders - will be implemented fully later
app.get('/api/entities', (req, res) => {
  res.json({ message: 'Entities endpoint - to be implemented' });
});

app.post('/api/entities', (req, res) => {
  res.json({ message: 'Create entity endpoint - to be implemented' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}

export default app;
