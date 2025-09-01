import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// List files
app.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const files = await c.env.DB
    .prepare('SELECT * FROM files WHERE uploaded_by = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();
  
  return c.json({ success: true, files: files.results });
});

// Upload file
app.post('/upload', async (c) => {
  // const userId = c.get('jwtPayload').sub;
  
  // TODO: Implement file upload to R2
  
  return c.json({ success: false, error: 'Not implemented' }, 501);
});

// Delete file
app.delete('/:id', async (c) => {
  // const fileId = c.req.param('id');
  // const userId = c.get('jwtPayload').sub;
  
  // TODO: Delete from R2 and database
  
  return c.json({ success: false, error: 'Not implemented' }, 501);
});

export default app;