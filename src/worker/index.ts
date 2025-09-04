import { Hono } from 'hono';
import { cors } from 'hono/cors';
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
import contextRoutes from './routes/context';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));

// Public routes
app.route('/api/auth', authRoutes);
app.route('/api/public', publicRoutes);

// Create a middleware that properly handles JWT with environment variables
const authMiddleware = async (c: any, next: any) => {
  // Get the JWT secret from environment
  const secret = c.env.JWT_SECRET || 'change-this-in-production';
  
  // Manually verify the JWT token
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { verify } = await import('hono/jwt');
    const payload = await verify(token, secret);
    c.set('jwtPayload', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
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
app.use('/api/context/*', authMiddleware);

// Protected API routes
app.route('/api/forms', formsRoutes);
app.route('/api/files', filesRoutes);
app.route('/api/database', databaseRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/actions', actionsRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/agents', agentsRoutes);
app.route('/api/executions', executionsRoutes);
app.route('/api/context', contextRoutes);

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