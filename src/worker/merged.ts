import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
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

const app = new Hono<{ Bindings: Env }>();

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

// 404 handler for API routes
app.notFound((c) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith('/api')) {
    return c.json({ error: 'Not found' }, 404);
  }
  // Let static handler take care of non-API routes
  return new Response(null, { status: 404 });
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Extend Env type to include static content bindings
interface ExtendedEnv extends Env {
  __STATIC_CONTENT: any;
  __STATIC_CONTENT_MANIFEST: string;
}

export default {
  async fetch(request: Request, env: ExtendedEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx);
    }
    
    // Handle static files
    try {
      // Check if bindings exist
      if (!env.__STATIC_CONTENT) {
        console.error('__STATIC_CONTENT binding not found');
        return new Response('Static content not configured', { status: 500 });
      }
      
      const response = await getAssetFromKV(
        {
          request,
          waitUntil(promise) {
            return ctx.waitUntil(promise);
          },
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        }
      );
      
      return response;
    } catch (e: any) {
      console.error('Error serving static file:', e.message || e);
      
      // For client-side routing, serve index.html for any non-file route
      try {
        const notFoundResponse = await getAssetFromKV(
          {
            request: new Request(`${url.origin}/index.html`),
            waitUntil(promise) {
              return ctx.waitUntil(promise);
            },
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          }
        );
        
        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 200,
        });
      } catch (err: any) {
        console.error('Error serving index.html:', err.message || err);
        return new Response('Not found', { status: 404 });
      }
    }
  },
};