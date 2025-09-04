import { Hono } from 'hono';
import type { Env } from '../types';
import type {
  ConversationGroup,
  Conversation,
  CreateGroupRequest,
  UpdateGroupRequest,
  CreateConversationRequest,
  SendMessageRequest,
  ChatWebhookRequest,
  ChatWebhookResponse,
} from '../../types/chat';
import type { AgentConfiguration } from '../../types/agent';

const app = new Hono<{ Bindings: Env }>();

// Helper to generate IDs
function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// CONVERSATION GROUPS
// ============================================

// List all groups for user
app.get('/groups', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  try {
    const { results } = await c.env.DB
      .prepare(`
        SELECT 
          g.*,
          a.name as agent_name,
          a.model as agent_model,
          COUNT(DISTINCT c.id) as conversation_count,
          MAX(c.last_message_at) as last_activity
        FROM conversation_groups g
        LEFT JOIN agents a ON g.agent_id = a.id
        LEFT JOIN conversations c ON g.id = c.group_id
        WHERE g.user_id = ?
        GROUP BY g.id
        ORDER BY 
          g.is_pinned DESC,
          g.position ASC,
          g.created_at DESC
      `)
      .bind(userId)
      .all();
    
    return c.json({ success: true, groups: results });
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return c.json({ success: false, error: 'Failed to fetch groups' }, 500);
  }
});

// Create new group
app.post('/groups', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json<CreateGroupRequest>();
  
  if (!body.name || !body.agent_id) {
    return c.json({ success: false, error: 'Name and agent_id are required' }, 400);
  }
  
  const groupId = generateGroupId();
  const now = new Date().toISOString();
  
  try {
    // Verify agent exists and user has access
    const agent = await c.env.DB
      .prepare('SELECT * FROM agents WHERE id = ? AND (user_id = ? OR is_public = true)')
      .bind(body.agent_id, userId)
      .first();
    
    if (!agent) {
      return c.json({ success: false, error: 'Agent not found or access denied' }, 404);
    }
    
    // Get next position
    const { max_position } = await c.env.DB
      .prepare('SELECT MAX(position) as max_position FROM conversation_groups WHERE user_id = ?')
      .bind(userId)
      .first() as { max_position: number | null };
    
    const position = (max_position || 0) + 1;
    
    // Create group
    await c.env.DB
      .prepare(`
        INSERT INTO conversation_groups (
          id, user_id, agent_id, name, description, icon, color,
          shared_context, shared_variables, position, is_archived, is_pinned,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        groupId,
        userId,
        body.agent_id,
        body.name,
        body.description || null,
        body.icon || '💬',
        body.color || '#6b7280',
        body.shared_context || null,
        JSON.stringify(body.shared_variables || {}),
        position,
        false,
        false,
        now,
        now
      )
      .run();
    
    // Return created group
    const group = await c.env.DB
      .prepare('SELECT * FROM conversation_groups WHERE id = ?')
      .bind(groupId)
      .first();
    
    return c.json({ success: true, group }, 201);
  } catch (error) {
    console.error('Failed to create group:', error);
    return c.json({ success: false, error: 'Failed to create group' }, 500);
  }
});

// Update group
app.put('/groups/:id', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const groupId = c.req.param('id');
  const body = await c.req.json<UpdateGroupRequest>();
  
  try {
    // Verify ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM conversation_groups WHERE id = ? AND user_id = ?')
      .bind(groupId, userId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Group not found' }, 404);
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    
    const fields = ['name', 'description', 'icon', 'color', 'shared_context', 
                   'position', 'is_archived', 'is_pinned', 'agent_id'];
    
    for (const field of fields) {
      if (body[field as keyof UpdateGroupRequest] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field as keyof UpdateGroupRequest]);
      }
    }
    
    if (body.shared_variables !== undefined) {
      updates.push('shared_variables = ?');
      values.push(JSON.stringify(body.shared_variables));
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(groupId);
    
    await c.env.DB
      .prepare(`UPDATE conversation_groups SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
    
    const group = await c.env.DB
      .prepare('SELECT * FROM conversation_groups WHERE id = ?')
      .bind(groupId)
      .first();
    
    return c.json({ success: true, group });
  } catch (error) {
    console.error('Failed to update group:', error);
    return c.json({ success: false, error: 'Failed to update group' }, 500);
  }
});

// Delete group
app.delete('/groups/:id', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const groupId = c.req.param('id');
  
  try {
    // Verify ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM conversation_groups WHERE id = ? AND user_id = ?')
      .bind(groupId, userId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Group not found' }, 404);
    }
    
    // Delete group (conversations will have group_id set to NULL due to ON DELETE SET NULL)
    await c.env.DB
      .prepare('DELETE FROM conversation_groups WHERE id = ?')
      .bind(groupId)
      .run();
    
    return c.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Failed to delete group:', error);
    return c.json({ success: false, error: 'Failed to delete group' }, 500);
  }
});

// ============================================
// CONVERSATIONS
// ============================================

// List conversations (with optional group filter)
app.get('/conversations', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const groupId = c.req.query('group_id');
  
  try {
    let query = `
      SELECT 
        c.*,
        a.name as agent_name,
        a.model as agent_model,
        g.name as group_name,
        g.icon as group_icon,
        g.color as group_color
      FROM conversations c
      LEFT JOIN agents a ON c.agent_id = a.id
      LEFT JOIN conversation_groups g ON c.group_id = g.id
      WHERE c.user_id = ?
    `;
    
    const params = [userId];
    
    if (groupId) {
      query += ' AND c.group_id = ?';
      params.push(groupId);
    }
    
    query += ' ORDER BY c.last_message_at DESC, c.updated_at DESC';
    
    const { results } = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all();
    
    return c.json({ success: true, conversations: results });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return c.json({ success: false, error: 'Failed to fetch conversations' }, 500);
  }
});

// Create conversation
app.post('/conversations', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json<CreateConversationRequest>();
  
  const conversationId = generateConversationId();
  const now = new Date().toISOString();
  
  try {
    let agentId = body.agent_id;
    let sessionId: string | null = null;
    
    // If group_id is provided, use group's agent and create/get shared session
    if (body.group_id) {
      const group = await c.env.DB
        .prepare('SELECT * FROM conversation_groups WHERE id = ? AND user_id = ?')
        .bind(body.group_id, userId)
        .first() as ConversationGroup | undefined;
      
      if (!group) {
        return c.json({ success: false, error: 'Group not found' }, 404);
      }
      
      agentId = group.agent_id;
      
      // Check if there's an existing session for this group
      const existingSession = await c.env.DB
        .prepare('SELECT shared_session_id FROM conversations WHERE group_id = ? AND shared_session_id IS NOT NULL LIMIT 1')
        .bind(body.group_id)
        .first() as { shared_session_id: string } | undefined;
      
      sessionId = existingSession?.shared_session_id || generateSessionId();
    }
    
    if (!agentId) {
      return c.json({ success: false, error: 'Agent ID is required' }, 400);
    }
    
    // Verify agent exists
    const agent = await c.env.DB
      .prepare('SELECT * FROM agents WHERE id = ? AND (user_id = ? OR is_public = true)')
      .bind(agentId, userId)
      .first();
    
    if (!agent) {
      return c.json({ success: false, error: 'Agent not found or access denied' }, 404);
    }
    
    // Create conversation
    await c.env.DB
      .prepare(`
        INSERT INTO conversations (
          id, user_id, agent_id, group_id, shared_session_id,
          title, message_count, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        conversationId,
        userId,
        agentId,
        body.group_id || null,
        sessionId,
        body.title || 'New Conversation',
        0,
        JSON.stringify(body.metadata || {}),
        now,
        now
      )
      .run();
    
    const conversation = await c.env.DB
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .bind(conversationId)
      .first();
    
    return c.json({ success: true, conversation }, 201);
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return c.json({ success: false, error: 'Failed to create conversation' }, 500);
  }
});

// Delete conversation
app.delete('/conversations/:id', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const conversationId = c.req.param('id');
  
  try {
    // Verify ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
      .bind(conversationId, userId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }
    
    await c.env.DB
      .prepare('DELETE FROM conversations WHERE id = ?')
      .bind(conversationId)
      .run();
    
    return c.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return c.json({ success: false, error: 'Failed to delete conversation' }, 500);
  }
});

// ============================================
// MESSAGES
// ============================================

// Get messages (direct D1 access to n8n memory format)
app.get('/conversations/:id/messages', async (c) => {
  const conversationId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  try {
    // Verify ownership
    const conversation = await c.env.DB
      .prepare(`
        SELECT c.*
        FROM conversations c
        WHERE c.id = ? AND c.user_id = ?
      `)
      .bind(conversationId, userId)
      .first() as Conversation | undefined;
    
    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }
    
    // Fetch messages from chat_memory table (n8n format)
    // Use conversation_id as session_id for n8n compatibility
    const { results } = await c.env.DB
      .prepare(`
        SELECT message_type, content, timestamp, metadata
        FROM chat_memory 
        WHERE session_id = ?
        ORDER BY timestamp ASC
        LIMIT 100
      `)
      .bind(conversationId)
      .all();
    
    // Transform n8n format to our ChatMessage format
    const messages = (results as any[]).map(row => ({
      role: row.message_type === 'human' ? 'user' : 'assistant',
      content: row.content,
      timestamp: row.timestamp,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
    
    return c.json({ success: true, messages });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return c.json({ success: false, error: 'Failed to fetch messages' }, 500);
  }
});

// Send message
app.post('/conversations/:id/messages', async (c) => {
  const conversationId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json<SendMessageRequest>();
  
  if (!body.message || body.message.trim().length === 0) {
    return c.json({ success: false, error: 'Message is required' }, 400);
  }
  
  try {
    // Get conversation with agent and group details
    const conversation = await c.env.DB
      .prepare(`
        SELECT 
          c.*,
          a.id as agent_id,
          a.name as agent_name,
          a.webhook_url,
          a.webhook_method,
          a.system_prompt,
          a.model,
          a.temperature,
          a.max_tokens,
          g.shared_context,
          g.shared_variables
        FROM conversations c
        JOIN agents a ON c.agent_id = a.id
        LEFT JOIN conversation_groups g ON c.group_id = g.id
        WHERE c.id = ? AND c.user_id = ?
      `)
      .bind(conversationId, userId)
      .first() as any;
    
    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }
    
    // Get agent configurations (headers, parameters)
    const { results: configs } = await c.env.DB
      .prepare('SELECT * FROM agent_configurations WHERE agent_id = ?')
      .bind(conversation.agent_id)
      .all();
    
    // Build webhook request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add configuration headers
    for (const config of configs as unknown as AgentConfiguration[]) {
      if (config.config_type === 'header') {
        headers[config.config_key] = config.config_value;
      }
    }
    
    // Build webhook request body
    const webhookRequest: ChatWebhookRequest = {
      message: body.message,
      conversation_id: conversationId,
      session_id: conversation.shared_session_id || undefined,
      agent_config: {
        name: conversation.agent_name,
        system_prompt: conversation.system_prompt,
        model: conversation.model,
        temperature: conversation.temperature,
        max_tokens: conversation.max_tokens,
      },
      attachments: body.attachments,
      metadata: body.metadata || {},
    };
    
    // Add group context if available
    if (conversation.group_id) {
      webhookRequest.group_context = {
        id: conversation.group_id,
        name: conversation.group_name,
        shared_context: conversation.shared_context,
        variables: conversation.shared_variables ? JSON.parse(conversation.shared_variables) : undefined,
      };
    }
    
    // Add configuration parameters to metadata
    for (const config of configs as unknown as AgentConfiguration[]) {
      if (config.config_type === 'parameter' && webhookRequest.metadata) {
        webhookRequest.metadata[config.config_key] = config.config_value;
      }
    }
    
    // Send to n8n webhook
    const response = await fetch(conversation.webhook_url, {
      method: conversation.webhook_method || 'POST',
      headers,
      body: JSON.stringify(webhookRequest),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error:', errorText);
      return c.json({ 
        success: false, 
        error: `Webhook returned ${response.status}: ${errorText}` 
      }, 500);
    }
    
    // Parse response with flexible format support
    let webhookResponse: ChatWebhookResponse;
    const responseText = await response.text();
    
    try {
      const parsed = JSON.parse(responseText);
      
      // Handle different response formats
      if (Array.isArray(parsed)) {
        // Format 1: n8n AI Agent default - array with output field
        const firstItem = parsed[0];
        webhookResponse = {
          response: firstItem?.output || firstItem?.response || String(firstItem),
          conversation_id: conversationId,
        };
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Format 2 & 3: Object with output or response field
        webhookResponse = {
          response: parsed.output || parsed.response || JSON.stringify(parsed),
          conversation_id: conversationId,
          metadata: parsed.metadata,
        };
      } else {
        // Format 4: Plain JSON value
        webhookResponse = {
          response: String(parsed),
          conversation_id: conversationId,
        };
      }
    } catch (e) {
      // Format 5: Plain text response
      webhookResponse = {
        response: responseText,
        conversation_id: conversationId,
      };
    }
    
    // Update conversation metadata
    const now = new Date().toISOString();
    await c.env.DB
      .prepare(`
        UPDATE conversations 
        SET 
          last_message_at = ?,
          message_count = message_count + 2,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(now, now, conversationId)
      .run();
    
    // Return the response
    return c.json({
      success: true,
      message: {
        role: 'assistant',
        content: webhookResponse.response,
        timestamp: now,
        metadata: webhookResponse.metadata,
      }
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    }, 500);
  }
});

export default app;