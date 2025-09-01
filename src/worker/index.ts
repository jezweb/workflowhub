import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import type { Env } from './types';

// Import routes
import authRoutes from './routes/auth';
import formsRoutes from './routes/forms';
import filesRoutes from './routes/files';
import databaseRoutes from './routes/database';
import chatRoutes from './routes/chat';
import actionsRoutes from './routes/actions';
import settingsRoutes from './routes/settings';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));

// Public routes
app.route('/api/auth', authRoutes);

// Protected routes - apply JWT middleware to each protected route group
const authMiddleware = jwt({
  secret: 'dev-secret', // Use the same secret for now
});

// Apply auth middleware to protected routes
app.use('/api/forms/*', authMiddleware);
app.use('/api/files/*', authMiddleware);
app.use('/api/database/*', authMiddleware);
app.use('/api/chat/*', authMiddleware);
app.use('/api/actions/*', authMiddleware);
app.use('/api/settings/*', authMiddleware);

// Protected API routes
app.route('/api/forms', formsRoutes);
app.route('/api/files', filesRoutes);
app.route('/api/database', databaseRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/actions', actionsRoutes);
app.route('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;