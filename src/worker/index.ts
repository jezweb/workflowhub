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
import agentsRoutes from './routes/agents';
import executionsRoutes from './routes/executions';
import publicRoutes from './routes/public';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));

// Public routes
app.route('/api/auth', authRoutes);
app.route('/api/public', publicRoutes);

// Create a middleware that dynamically gets JWT secret
const authMiddleware = async (c: any, next: any) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET || 'change-this-in-production',
  });
  return jwtMiddleware(c, next);
};

// Apply auth middleware to protected routes
app.use('/api/forms/*', authMiddleware);
app.use('/api/files/*', authMiddleware);
app.use('/api/database/*', authMiddleware);
app.use('/api/chat/*', authMiddleware);
app.use('/api/actions/*', authMiddleware);
app.use('/api/settings/*', authMiddleware);
app.use('/api/agents/*', authMiddleware);
app.use('/api/executions/*', authMiddleware);

// Protected API routes
app.route('/api/forms', formsRoutes);
app.route('/api/files', filesRoutes);
app.route('/api/database', databaseRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/actions', actionsRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/agents', agentsRoutes);
app.route('/api/executions', executionsRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static assets for non-API routes
app.get('*', async (c) => {
  // For non-API routes, serve static assets
  return c.env.ASSETS.fetch(c.req.raw);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;