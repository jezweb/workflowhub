import { Hono } from 'hono';
import type { Env } from '../types';
import type { 
  Agent, 
  AgentConfiguration, 
  CreateAgentRequest, 
  UpdateAgentRequest,
  TestAgentRequest,
  TestAgentResponse
} from '../../types/agent';

const app = new Hono<{ Bindings: Env }>();

// Helper to generate IDs
function generateAgentId(): string {
  return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateConfigId(): string {
  return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validation helper
function validateAgent(agent: Partial<Agent>): string[] {
  const errors: string[] = [];
  
  if (!agent.name || agent.name.trim().length === 0) {
    errors.push('Agent name is required');
  }
  
  if (!agent.webhook_url || !isValidUrl(agent.webhook_url)) {
    errors.push('Valid webhook URL is required');
  }
  
  if (agent.temperature !== undefined && (agent.temperature < 0 || agent.temperature > 2)) {
    errors.push('Temperature must be between 0 and 2');
  }
  
  if (agent.max_tokens !== undefined && agent.max_tokens < 1) {
    errors.push('Max tokens must be at least 1');
  }
  
  return errors;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Get all agents for user
app.get('/', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  
  try {
    // Get user's agents and public agents
    const { results } = await c.env.DB
      .prepare(`
        SELECT * FROM agents 
        WHERE (user_id = ? OR is_public = true) AND is_active = true
        ORDER BY 
          CASE WHEN user_id = ? THEN 0 ELSE 1 END,
          created_at DESC
      `)
      .bind(userId, userId)
      .all();
    
    return c.json({ success: true, agents: results });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return c.json({ success: false, error: 'Failed to fetch agents' }, 500);
  }
});

// Get single agent with configurations
app.get('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const agentId = c.req.param('id');
  
  try {
    // Get agent
    const agent = await c.env.DB
      .prepare(`
        SELECT * FROM agents 
        WHERE id = ? AND (user_id = ? OR is_public = true)
      `)
      .bind(agentId, userId)
      .first();
    
    if (!agent) {
      return c.json({ success: false, error: 'Agent not found' }, 404);
    }
    
    // Get configurations if user owns the agent
    let configurations: AgentConfiguration[] = [];
    if (agent.user_id === userId) {
      const { results } = await c.env.DB
        .prepare('SELECT * FROM agent_configurations WHERE agent_id = ?')
        .bind(agentId)
        .all();
      configurations = results as unknown as AgentConfiguration[];
    }
    
    return c.json({ 
      success: true, 
      agent,
      configurations
    });
  } catch (error) {
    console.error('Failed to fetch agent:', error);
    return c.json({ success: false, error: 'Failed to fetch agent' }, 500);
  }
});

// Create new agent
app.post('/', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const body = await c.req.json<CreateAgentRequest>();
  
  // Validate
  const errors = validateAgent(body);
  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }
  
  const agentId = generateAgentId();
  const now = new Date().toISOString();
  
  try {
    // Start transaction
    const statements = [];
    
    // Insert agent
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO agents (
          id, user_id, name, description, avatar_url, system_prompt,
          webhook_url, webhook_method,
          model, temperature, max_tokens, is_active, is_public,
          metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        agentId,
        userId,
        body.name,
        body.description || null,
        body.avatar_url || null,
        body.system_prompt || null,
        body.webhook_url,
        body.webhook_method || 'POST',
        body.model || 'gpt-4',
        body.temperature ?? 0.7,
        body.max_tokens || 2000,
        body.is_active ?? true,
        body.is_public || false,
        JSON.stringify(body.metadata || {}),
        now,
        now
      )
    );
    
    // Insert configurations if provided
    if (body.configurations && body.configurations.length > 0) {
      for (const config of body.configurations) {
        const configId = generateConfigId();
        statements.push(
          c.env.DB.prepare(`
            INSERT INTO agent_configurations (
              id, agent_id, config_key, config_value, config_type, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            configId,
            agentId,
            config.config_key,
            config.config_value,
            config.config_type || 'header',
            now
          )
        );
      }
    }
    
    // Execute transaction
    await c.env.DB.batch(statements);
    
    // Return created agent
    const agent = await c.env.DB
      .prepare('SELECT * FROM agents WHERE id = ?')
      .bind(agentId)
      .first();
    
    return c.json({ success: true, agent }, 201);
  } catch (error) {
    console.error('Failed to create agent:', error);
    return c.json({ success: false, error: 'Failed to create agent' }, 500);
  }
});

// Update agent
app.put('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const agentId = c.req.param('id');
  const body = await c.req.json<UpdateAgentRequest>();
  
  try {
    // Check ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM agents WHERE id = ? AND user_id = ?')
      .bind(agentId, userId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Agent not found or unauthorized' }, 404);
    }
    
    // Validate if webhook URL changed
    if (body.webhook_url) {
      const errors = validateAgent({ ...existing, ...body });
      if (errors.length > 0) {
        return c.json({ success: false, errors }, 400);
      }
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    
    const updateableFields = [
      'name', 'description', 'avatar_url', 'system_prompt',
      'webhook_url', 'webhook_method',
      'model', 'temperature', 'max_tokens', 'is_active', 'is_public'
    ];
    
    for (const field of updateableFields) {
      if (body[field as keyof UpdateAgentRequest] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field as keyof UpdateAgentRequest]);
      }
    }
    
    if (body.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(body.metadata));
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    
    values.push(agentId);
    
    await c.env.DB
      .prepare(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
    
    // Handle configurations update if provided
    if (body.configurations) {
      // Delete existing configurations
      await c.env.DB
        .prepare('DELETE FROM agent_configurations WHERE agent_id = ?')
        .bind(agentId)
        .run();
      
      // Insert new configurations
      const statements = [];
      for (const config of body.configurations) {
        const configId = generateConfigId();
        statements.push(
          c.env.DB.prepare(`
            INSERT INTO agent_configurations (
              id, agent_id, config_key, config_value, config_type, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            configId,
            agentId,
            config.config_key,
            config.config_value,
            config.config_type || 'header',
            new Date().toISOString()
          )
        );
      }
      
      if (statements.length > 0) {
        await c.env.DB.batch(statements);
      }
    }
    
    // Return updated agent
    const agent = await c.env.DB
      .prepare('SELECT * FROM agents WHERE id = ?')
      .bind(agentId)
      .first();
    
    return c.json({ success: true, agent });
  } catch (error) {
    console.error('Failed to update agent:', error);
    return c.json({ success: false, error: 'Failed to update agent' }, 500);
  }
});

// Delete agent
app.delete('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const agentId = c.req.param('id');
  
  try {
    // Check ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM agents WHERE id = ? AND user_id = ?')
      .bind(agentId, userId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Agent not found or unauthorized' }, 404);
    }
    
    // Delete agent (cascades to configurations and conversations)
    await c.env.DB
      .prepare('DELETE FROM agents WHERE id = ?')
      .bind(agentId)
      .run();
    
    return c.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Failed to delete agent:', error);
    return c.json({ success: false, error: 'Failed to delete agent' }, 500);
  }
});

// Test agent webhook
app.post('/:id/test', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const agentId = c.req.param('id');
  const body = await c.req.json<TestAgentRequest>();
  
  try {
    // Get agent with configurations
    const agent = await c.env.DB
      .prepare(`
        SELECT * FROM agents 
        WHERE id = ? AND (user_id = ? OR is_public = true)
      `)
      .bind(agentId, userId)
      .first() as Agent | undefined;
    
    if (!agent) {
      return c.json({ success: false, error: 'Agent not found' }, 404);
    }
    
    // Get configurations
    const { results: configs } = await c.env.DB
      .prepare('SELECT * FROM agent_configurations WHERE agent_id = ?')
      .bind(agentId)
      .all();
    
    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add configuration headers
    for (const config of configs as unknown as AgentConfiguration[]) {
      if (config.config_type === 'header') {
        headers[config.config_key] = config.config_value;
      }
    }
    
    // Build request body
    const requestBody = {
      message: body.message,
      agent_config: {
        name: agent.name,
        system_prompt: agent.system_prompt,
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
      },
      metadata: body.test_config || {},
    };
    
    // Add configuration parameters
    for (const config of configs as unknown as AgentConfiguration[]) {
      if (config.config_type === 'parameter') {
        requestBody.metadata[config.config_key] = config.config_value;
      }
    }
    
    // Send test request
    const startTime = Date.now();
    const response = await fetch(agent.webhook_url, {
      method: agent.webhook_method,
      headers,
      body: JSON.stringify(requestBody),
    });
    
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      return c.json<TestAgentResponse>({ 
        success: false, 
        error: `Webhook returned ${response.status}: ${errorText}`,
        latency 
      });
    }
    
    const responseData = await response.text();
    
    return c.json<TestAgentResponse>({ 
      success: true, 
      response: responseData,
      latency 
    });
  } catch (error) {
    console.error('Failed to test agent:', error);
    return c.json<TestAgentResponse>({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test agent' 
    }, 500);
  }
});

export default app;