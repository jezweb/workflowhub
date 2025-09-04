import { Hono } from 'hono';
import type { Env } from '../types';
import { variableService } from '../services/variables';

const app = new Hono<{ Bindings: Env }>();

// List actions
app.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const actions = await c.env.DB
    .prepare('SELECT * FROM actions WHERE created_by = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();
  
  // Parse JSON fields for each action
  const parsedActions = actions.results.map((action: any) => ({
    ...action,
    headers: typeof action.headers === 'string' ? JSON.parse(action.headers) : action.headers,
    payload: typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload
  }));
  
  return c.json({ success: true, actions: parsedActions });
});

// Get single action
app.get('/:id', async (c) => {
  const actionId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  const action = await c.env.DB
    .prepare('SELECT * FROM actions WHERE id = ? AND created_by = ?')
    .bind(actionId, userId)
    .first();
  
  if (!action) {
    return c.json({ error: 'Action not found' }, 404);
  }
  
  // Parse JSON fields
  const parsedAction = {
    ...action,
    headers: typeof action.headers === 'string' ? JSON.parse(action.headers) : action.headers,
    payload: typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload
  };
  
  return c.json({ success: true, action: parsedAction });
});

// Create action
app.post('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  const actionId = crypto.randomUUID();
  
  await c.env.DB
    .prepare(`
      INSERT INTO actions (
        id, name, description, method, url, headers, payload, response_type,
        icon, color_theme, button_style, on_success, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      body.icon || '⚡',
      body.color_theme || 'slate',
      body.button_style || 'solid',
      body.on_success || 'toast',
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
      SET name = ?, description = ?, method = ?, url = ?, headers = ?, payload = ?, response_type = ?,
          icon = ?, color_theme = ?, button_style = ?, on_success = ?, updated_at = CURRENT_TIMESTAMP
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
      body.icon || '⚡',
      body.color_theme || 'slate',
      body.button_style || 'solid',
      body.on_success || 'toast',
      actionId,
      userId
    )
    .run();
  
  if (result.meta.changes === 0) {
    return c.json({ error: 'Action not found or unauthorized' }, 404);
  }
  
  return c.json({ success: true });
});

// Get available variables for UI display
app.get('/variables', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const variables = await variableService.getAllVariables({
    userId,
    db: c.env.DB
  });

  // Group variables by category for better UI display
  const grouped: Record<string, Record<string, string>> = {
    user: {},
    organization: {},
    team: {},
    custom: {},
    my: {},
    time: {},
    system: {}
  };

  Object.entries(variables).forEach(([key, value]) => {
    if (key.startsWith('{{user.')) {
      grouped.user[key] = value;
    } else if (key.startsWith('{{org.')) {
      grouped.organization[key] = value;
    } else if (key.startsWith('{{team.')) {
      grouped.team[key] = value;
    } else if (key.startsWith('{{custom.')) {
      grouped.custom[key] = value;
    } else if (key.startsWith('{{my.')) {
      grouped.my[key] = value;
    } else if (key.startsWith('{{time.') || key.includes('timestamp') || key.includes('date')) {
      grouped.time[key] = value;
    } else if (key.startsWith('{{system.') || key.includes('random')) {
      grouped.system[key] = value;
    }
  });

  return c.json({ 
    success: true, 
    variables,
    grouped,
    total: Object.keys(variables).length
  });
});

// Execute action (no dynamic data from user)
app.post('/:id/execute', async (c) => {
  const actionId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  // Get action details
  const action = await c.env.DB
    .prepare('SELECT * FROM actions WHERE id = ? AND created_by = ?')
    .bind(actionId, userId)
    .first();
  
  if (!action) {
    return c.json({ error: 'Action not found' }, 404);
  }

  // Get all available variables for substitution
  const variables = await variableService.getAllVariables({
    userId,
    db: c.env.DB
  });
  
  // Create execution record
  const executionId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    // Parse and substitute variables in payload
    const payload = JSON.parse(action.payload as string);
    const substitutedPayload = variableService.substituteInObject(payload, variables);

    // Parse and substitute variables in headers
    const parsedHeaders = JSON.parse(action.headers as string);
    const substitutedHeaders = variableService.substituteInObject(parsedHeaders, variables);
    
    const headers = {
      'Content-Type': 'application/json',
      ...substitutedHeaders,
    };

    // Create initial execution record (pending)
    await c.env.DB
      .prepare(`
        INSERT INTO action_executions (
          id, action_id, action_name, user_id, status, 
          request_url, request_method, request_headers, request_payload,
          created_at
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        executionId,
        actionId,
        action.name as string,
        userId,
        action.url as string,
        action.method as string,
        JSON.stringify(headers),
        JSON.stringify(substitutedPayload)
      )
      .run();

    // Substitute variables in URL
    const substitutedUrl = variableService.substituteVariables(action.url as string, variables);
    
    // Execute webhook
    const response = await fetch(substitutedUrl, {
      method: action.method as string,
      headers,
      body: action.method !== 'GET' ? JSON.stringify(substitutedPayload) : undefined,
    });
    
    const result = await response.text();
    const duration = Date.now() - startTime;
    
    // Update execution record with result
    await c.env.DB
      .prepare(`
        UPDATE action_executions 
        SET status = ?, response_status = ?, response_body = ?, duration_ms = ?
        WHERE id = ?
      `)
      .bind(
        response.ok ? 'success' : 'error',
        response.status,
        result.substring(0, 10000), // Limit response body size
        duration,
        executionId
      )
      .run();
    
    return c.json({
      success: response.ok,
      status: response.status,
      data: result,
      response_type: action.on_success || action.response_type || 'toast',
      execution_id: executionId,
    });
  } catch (error: any) {
    console.error('Action execution error:', error);
    
    // Update execution record with error
    const duration = Date.now() - startTime;
    await c.env.DB
      .prepare(`
        UPDATE action_executions 
        SET status = 'error', error_message = ?, duration_ms = ?
        WHERE id = ?
      `)
      .bind(
        error.message || 'Unknown error',
        duration,
        executionId
      )
      .run();
    
    return c.json({ 
      error: 'Action execution failed',
      execution_id: executionId,
    }, 500);
  }
});

// Test action endpoint
app.post('/:id/test', async (c) => {
  const actionId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  // Get action details
  const action = await c.env.DB
    .prepare('SELECT * FROM actions WHERE id = ? AND created_by = ?')
    .bind(actionId, userId)
    .first();
  
  if (!action) {
    return c.json({ error: 'Action not found' }, 404);
  }

  // Get all available variables for substitution
  const variables = await variableService.getAllVariables({
    userId,
    db: c.env.DB
  });
  
  try {
    // Parse and substitute variables in payload
    const payload = JSON.parse(action.payload as string);
    const substitutedPayload = variableService.substituteInObject(payload, variables);

    // Parse and substitute variables in headers
    const parsedHeaders = JSON.parse(action.headers as string);
    const substitutedHeaders = variableService.substituteInObject(parsedHeaders, variables);
    
    // Prepare headers with test mode indicator
    const headers = {
      'Content-Type': 'application/json',
      'X-Test-Mode': 'true',
      ...substitutedHeaders,
    };

    // Substitute variables in URL for preview
    const substitutedUrl = variableService.substituteVariables(action.url as string, variables);
    
    // Return request preview without executing
    return c.json({
      success: true,
      preview: {
        url: substitutedUrl,
        method: action.method,
        headers: headers,
        payload: action.method !== 'GET' ? substitutedPayload : null,
      },
      message: 'Test preview generated. Click "Execute" to send the actual request.',
    });
  } catch (error) {
    console.error('Test preview error:', error);
    return c.json({ error: 'Failed to generate test preview' }, 500);
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