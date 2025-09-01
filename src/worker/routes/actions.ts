import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// List actions
app.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const actions = await c.env.DB
    .prepare('SELECT * FROM actions WHERE created_by = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();
  
  return c.json({ success: true, actions: actions.results });
});

// Create action
app.post('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  const actionId = crypto.randomUUID();
  
  await c.env.DB
    .prepare(`
      INSERT INTO actions (id, name, description, method, url, headers, payload, response_type, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      actionId,
      body.name,
      body.description || null,
      body.method,
      body.url,
      JSON.stringify(body.headers || {}),
      JSON.stringify(body.payload || {}),
      body.response_type || 'modal',
      userId
    )
    .run();
  
  return c.json({ success: true, id: actionId });
});

// Update action
app.put('/:id', async (c) => {
  const actionId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  const result = await c.env.DB
    .prepare(`
      UPDATE actions 
      SET name = ?, description = ?, method = ?, url = ?, headers = ?, payload = ?, response_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND created_by = ?
    `)
    .bind(
      body.name,
      body.description || null,
      body.method,
      body.url,
      JSON.stringify(body.headers || {}),
      JSON.stringify(body.payload || {}),
      body.response_type || 'modal',
      actionId,
      userId
    )
    .run();
  
  if (result.meta.changes === 0) {
    return c.json({ error: 'Action not found or unauthorized' }, 404);
  }
  
  return c.json({ success: true });
});

// Execute action
app.post('/:id/execute', async (c) => {
  const actionId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  const action = await c.env.DB
    .prepare('SELECT * FROM actions WHERE id = ? AND created_by = ?')
    .bind(actionId, userId)
    .first();
  
  if (!action) {
    return c.json({ error: 'Action not found' }, 404);
  }
  
  try {
    // Execute webhook
    const response = await fetch(action.url as string, {
      method: action.method as string,
      headers: {
        'Content-Type': 'application/json',
        ...JSON.parse(action.headers as string),
      },
      body: action.method !== 'GET' ? JSON.stringify({
        ...JSON.parse(action.payload as string),
        ...body.data,
      }) : undefined,
    });
    
    const result = await response.text();
    
    return c.json({
      success: true,
      status: response.status,
      data: result,
      response_type: action.response_type,
    });
  } catch (error) {
    console.error('Action execution error:', error);
    return c.json({ error: 'Action execution failed' }, 500);
  }
});

// Delete action
app.delete('/:id', async (c) => {
  const actionId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  const result = await c.env.DB
    .prepare('DELETE FROM actions WHERE id = ? AND created_by = ?')
    .bind(actionId, userId)
    .run();
  
  if (result.meta.changes === 0) {
    return c.json({ error: 'Action not found' }, 404);
  }
  
  return c.json({ success: true });
});

export default app;