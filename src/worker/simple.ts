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

// Extend Env to include ASSETS binding
interface ExtendedEnv extends Env {
  ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: ExtendedEnv }>();

// Global middleware
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));

// Public routes
app.route('/api/auth', authRoutes);

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
app.use('/api/conversations/*', authMiddleware);
app.use('/api/actions/*', authMiddleware);
app.use('/api/settings/*', authMiddleware);
app.use('/api/agents/*', authMiddleware);

// Protected API routes
app.route('/api/forms', formsRoutes);
app.route('/api/files', filesRoutes);
app.route('/api/database', databaseRoutes);
app.route('/api', chatRoutes);
app.route('/api/actions', actionsRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/agents', agentsRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the worker
export default {
  async fetch(request: Request, env: ExtendedEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle API routes with Hono
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx);
    }
    
    // For all other routes, serve static assets
    // The not_found_handling = "single-page-application" in wrangler.toml
    // will automatically serve index.html for navigation requests
    return env.ASSETS.fetch(request);
  },
};