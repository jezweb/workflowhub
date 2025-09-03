import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// List executions with filtering
app.get('/', async (c) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const status = c.req.query('status');
    const actionId = c.req.query('action_id');
    const unreadOnly = c.req.query('unread_only') === 'true';
    
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = ['user_id = ?'];
    const params: any[] = [userId];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (actionId) {
      conditions.push('action_id = ?');
      params.push(actionId);
    }
    
    if (unreadOnly) {
      conditions.push('is_read = FALSE');
    }
    
    const whereClause = conditions.join(' AND ');
    
    // Get total count
    const countQuery = await c.env.DB
      .prepare(`SELECT COUNT(*) as total FROM action_executions WHERE ${whereClause}`)
      .bind(...params)
      .first();
    
    const total = (countQuery as any)?.total || 0;
    
    // Get unread count
    const unreadQuery = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM action_executions WHERE user_id = ? AND is_read = FALSE')
      .bind(userId)
      .first();
    
    const unreadCount = (unreadQuery as any)?.count || 0;
    
    // Get executions
    const executions = await c.env.DB
      .prepare(`
        SELECT * FROM action_executions 
        WHERE ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `)
      .bind(...params, limit, offset)
      .all();
    
    // Parse JSON fields
    const parsedExecutions = executions.results.map((exec: any) => ({
      ...exec,
      request_headers: exec.request_headers ? JSON.parse(exec.request_headers as string) : null,
      request_payload: exec.request_payload ? JSON.parse(exec.request_payload as string) : null,
    }));
    
    return c.json({
      executions: parsedExecutions,
      total,
      unread_count: unreadCount,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to list executions:', error);
    return c.json({ error: 'Failed to list executions' }, 500);
  }
});

// Get single execution details
app.get('/:id', async (c) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const executionId = c.req.param('id');
    
    const execution = await c.env.DB
      .prepare('SELECT * FROM action_executions WHERE id = ? AND user_id = ?')
      .bind(executionId, userId)
      .first();
    
    if (!execution) {
      return c.json({ error: 'Execution not found' }, 404);
    }
    
    // Parse JSON fields
    const parsed = {
      ...execution,
      request_headers: execution.request_headers ? JSON.parse(execution.request_headers as string) : null,
      request_payload: execution.request_payload ? JSON.parse(execution.request_payload as string) : null,
    };
    
    return c.json(parsed);
  } catch (error) {
    console.error('Failed to get execution:', error);
    return c.json({ error: 'Failed to get execution' }, 500);
  }
});

// Get unread count
app.get('/unread/count', async (c) => {
  try {
    const userId = c.get('jwtPayload').sub;
    
    const result = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM action_executions WHERE user_id = ? AND is_read = FALSE')
      .bind(userId)
      .first();
    
    return c.json({ count: (result as any)?.count || 0 });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return c.json({ error: 'Failed to get unread count' }, 500);
  }
});

// Mark execution as read
app.patch('/:id/read', async (c) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const executionId = c.req.param('id');
    
    await c.env.DB
      .prepare('UPDATE action_executions SET is_read = TRUE WHERE id = ? AND user_id = ?')
      .bind(executionId, userId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to mark as read:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// Mark all as read
app.post('/mark-all-read', async (c) => {
  try {
    const userId = c.get('jwtPayload').sub;
    
    await c.env.DB
      .prepare('UPDATE action_executions SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE')
      .bind(userId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return c.json({ error: 'Failed to mark all as read' }, 500);
  }
});

// Delete execution
app.delete('/:id', async (c) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const executionId = c.req.param('id');
    
    await c.env.DB
      .prepare('DELETE FROM action_executions WHERE id = ? AND user_id = ?')
      .bind(executionId, userId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete execution:', error);
    return c.json({ error: 'Failed to delete execution' }, 500);
  }
});

// Clear all executions
app.delete('/', async (c) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const status = c.req.query('status'); // Optional: clear only by status
    
    let query = 'DELETE FROM action_executions WHERE user_id = ?';
    const params = [userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    await c.env.DB
      .prepare(query)
      .bind(...params)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to clear executions:', error);
    return c.json({ error: 'Failed to clear executions' }, 500);
  }
});

export default app;