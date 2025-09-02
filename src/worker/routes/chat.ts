import { Hono } from 'hono';
import type { Env } from '../types';
import type { 
  AgentConfiguration, 
  Conversation, 
  ChatMessage,
  CreateConversationRequest,
  CreateConversationResponse,
  SendMessageRequest,
  SendMessageResponse,
  ListConversationsResponse,
  GetConversationResponse,
  UpdateConversationRequest,
  N8nWebhookPayload
} from '../../types/agent';

const app = new Hono<{ Bindings: Env }>();

// Helper functions
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function validateSendMessageRequest(request: Partial<SendMessageRequest>): string[] {
  const errors: string[] = [];
  
  if (!request.content || request.content.trim().length === 0) {
    errors.push('Message content is required');
  }
  
  if (request.content && request.content.length > 10000) {
    errors.push('Message content must be less than 10,000 characters');
  }
  
  if (request.attachments && request.attachments.length > 10) {
    errors.push('Maximum 10 attachments allowed per message');
  }
  
  return errors;
}

function validateCreateConversationRequest(request: Partial<CreateConversationRequest>): string[] {
  const errors: string[] = [];
  
  if (!request.agent_id || request.agent_id.trim().length === 0) {
    errors.push('Agent ID is required');
  }
  
  if (request.title && request.title.length > 200) {
    errors.push('Conversation title must be less than 200 characters');
  }
  
  if (request.initial_message && request.initial_message.length > 10000) {
    errors.push('Initial message must be less than 10,000 characters');
  }
  
  return errors;
}

// List user conversations with agent details
app.get('/conversations', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  
  try {
    const { results } = await c.env.DB
      .prepare(`
        SELECT 
          c.*,
          a.name as agent_name,
          a.description as agent_description,
          a.avatar_url as agent_avatar_url,
          a.is_public as agent_is_public
        FROM conversations c
        LEFT JOIN agents a ON c.agent_id = a.id
        WHERE c.user_id = ?
        ORDER BY c.last_message_at DESC, c.updated_at DESC
      `)
      .bind(userId)
      .all();
    
    return c.json<ListConversationsResponse>({ 
      success: true, 
      conversations: results as unknown as Conversation[] 
    });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return c.json<ListConversationsResponse>({ 
      success: false, 
      error: 'Failed to fetch conversations' 
    }, 500);
  }
});

// Get single conversation with messages
app.get('/conversations/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const conversationId = c.req.param('id');
  
  try {
    // Get conversation with agent details
    const conversation = await c.env.DB
      .prepare(`
        SELECT 
          c.*,
          a.name as agent_name,
          a.description as agent_description,
          a.avatar_url as agent_avatar_url,
          a.is_public as agent_is_public,
          a.webhook_url as agent_webhook_url
        FROM conversations c
        LEFT JOIN agents a ON c.agent_id = a.id
        WHERE c.id = ? AND c.user_id = ?
      `)
      .bind(conversationId, userId)
      .first();
    
    if (!conversation) {
      return c.json<GetConversationResponse>({ 
        success: false, 
        error: 'Conversation not found' 
      }, 404);
    }
    
    // Get messages
    const { results: messages } = await c.env.DB
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .bind(conversationId)
      .all();
    
    return c.json<GetConversationResponse>({ 
      success: true, 
      conversation: conversation as unknown as Conversation,
      messages: messages as unknown as ChatMessage[]
    });
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    return c.json<GetConversationResponse>({ 
      success: false, 
      error: 'Failed to fetch conversation' 
    }, 500);
  }
});

// Create new conversation
app.post('/conversations', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const body = await c.req.json<CreateConversationRequest>();
  
  // Validate request
  const errors = validateCreateConversationRequest(body);
  if (errors.length > 0) {
    return c.json<CreateConversationResponse>({ 
      success: false, 
      error: errors.join(', ') 
    }, 400);
  }
  
  try {
    // Verify agent exists and user has access
    const agent = await c.env.DB
      .prepare(`
        SELECT * FROM agents 
        WHERE id = ? AND (user_id = ? OR is_public = true) AND is_active = true
      `)
      .bind(body.agent_id, userId)
      .first();
    
    if (!agent) {
      return c.json<CreateConversationResponse>({ 
        success: false, 
        error: 'Agent not found or not accessible' 
      }, 404);
    }
    
    const conversationId = generateConversationId();
    const now = new Date().toISOString();
    
    // Create conversation
    await c.env.DB
      .prepare(`
        INSERT INTO conversations (
          id, user_id, agent_id, title, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        conversationId,
        userId,
        body.agent_id,
        body.title || `Chat with ${agent.name}`,
        JSON.stringify(body.metadata || {}),
        now,
        now
      )
      .run();
    
    // Handle initial message if provided
    let initialMessage: ChatMessage | undefined;
    if (body.initial_message && body.initial_message.trim()) {
      const messageId = generateMessageId();
      
      // Store user message
      await c.env.DB
        .prepare(`
          INSERT INTO messages (
            id, conversation_id, role, content, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(
          messageId,
          conversationId,
          'user',
          body.initial_message.trim(),
          JSON.stringify({}),
          now
        )
        .run();
      
      initialMessage = {
        id: messageId,
        conversation_id: conversationId,
        role: 'user',
        content: body.initial_message.trim(),
        metadata: {},
        created_at: now
      };
    }
    
    // Get the created conversation
    const conversation = await c.env.DB
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .bind(conversationId)
      .first();
    
    return c.json<CreateConversationResponse>({ 
      success: true, 
      conversation: conversation as unknown as Conversation,
      message: initialMessage 
    }, 201);
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return c.json<CreateConversationResponse>({ 
      success: false, 
      error: 'Failed to create conversation' 
    }, 500);
  }
});

// Send message in conversation
app.post('/conversations/:id/messages', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const conversationId = c.req.param('id');
  const body = await c.req.json<SendMessageRequest>();
  
  // Validate request
  const errors = validateSendMessageRequest(body);
  if (errors.length > 0) {
    return c.json<SendMessageResponse>({ 
      success: false, 
      error: errors.join(', ') 
    }, 400);
  }
  
  try {
    // Get conversation with agent details
    const conversation = await c.env.DB
      .prepare(`
        SELECT 
          c.*,
          a.name as agent_name,
          a.webhook_url as agent_webhook_url,
          a.webhook_method as agent_webhook_method,
          a.model as agent_model,
          a.temperature as agent_temperature,
          a.max_tokens as agent_max_tokens,
          a.system_prompt as agent_system_prompt,
          u.username
        FROM conversations c
        LEFT JOIN agents a ON c.agent_id = a.id
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ? AND c.user_id = ?
      `)
      .bind(conversationId, userId)
      .first();
    
    if (!conversation) {
      return c.json<SendMessageResponse>({ 
        success: false, 
        error: 'Conversation not found' 
      }, 404);
    }
    
    const now = new Date().toISOString();
    const userMessageId = generateMessageId();
    
    // Store user message
    await c.env.DB
      .prepare(`
        INSERT INTO messages (
          id, conversation_id, role, content, attachments, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userMessageId,
        conversationId,
        'user',
        body.content.trim(),
        JSON.stringify(body.attachments || []),
        JSON.stringify(body.metadata || {}),
        now
      )
      .run();
    
    const userMessage: ChatMessage = {
      id: userMessageId,
      conversation_id: conversationId,
      role: 'user',
      content: body.content.trim(),
      attachments: body.attachments || [],
      metadata: body.metadata || {},
      created_at: now
    };
    
    // Get recent conversation history for context (last 10 messages)
    const { results: historyResults } = await c.env.DB
      .prepare(`
        SELECT * FROM messages 
        WHERE conversation_id = ? AND id != ?
        ORDER BY created_at DESC 
        LIMIT 10
      `)
      .bind(conversationId, userMessageId)
      .all();
    
    const conversationHistory = (historyResults as unknown as ChatMessage[]).reverse();
    
    // Get agent configurations
    const { results: configs } = await c.env.DB
      .prepare('SELECT * FROM agent_configurations WHERE agent_id = ?')
      .bind(conversation.agent_id)
      .all();
    
    // Build n8n webhook payload
    const webhookPayload: N8nWebhookPayload = {
      message: body.content.trim(),
      conversation_id: conversationId,
      agent_config: {
        name: conversation.agent_name as string,
        system_prompt: conversation.agent_system_prompt as string | undefined,
        model: conversation.agent_model as string,
        temperature: conversation.agent_temperature as number,
        max_tokens: conversation.agent_max_tokens as number,
      },
      conversation_history: conversationHistory,
      user_context: {
        user_id: userId,
        username: conversation.username as string,
      },
      attachments: body.attachments || [],
      metadata: { ...(body.metadata || {}) },
    };
    
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
    
    // Add configuration parameters to metadata
    for (const config of configs as unknown as AgentConfiguration[]) {
      if (config.config_type === 'parameter') {
        if (webhookPayload.metadata) {
          webhookPayload.metadata[config.config_key] = config.config_value;
        }
      }
    }
    
    // Call n8n webhook
    const startTime = Date.now();
    const webhookResponse = await fetch(conversation.agent_webhook_url as string, {
      method: (conversation.agent_webhook_method as string) || 'POST',
      headers,
      body: JSON.stringify(webhookPayload),
    });
    
    const latency = Date.now() - startTime;
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      return c.json<SendMessageResponse>({ 
        success: false, 
        error: `Agent webhook failed: ${webhookResponse.status} ${errorText}`,
        user_message: userMessage,
        latency 
      });
    }
    
    // Parse AI response - handle both n8n formats
    const rawResponse: any = await webhookResponse.json();
    let aiMessage: string;
    let aiMetadata: Record<string, any> = {};
    
    // Handle different response formats from n8n
    if (Array.isArray(rawResponse) && rawResponse.length > 0) {
      // n8n array format: [{"output": "message"}] or [{"message": "message"}]
      const firstItem = rawResponse[0];
      aiMessage = firstItem.message || firstItem.output || firstItem.text || JSON.stringify(firstItem);
      aiMetadata = firstItem.metadata || {};
    } else if (typeof rawResponse === 'object' && rawResponse !== null) {
      // Direct object format: {"message": "..."} or {"output": "..."}
      if ('error' in rawResponse && rawResponse.error) {
        return c.json<SendMessageResponse>({ 
          success: false, 
          error: `Agent error: ${rawResponse.error}`,
          user_message: userMessage,
          latency 
        });
      }
      aiMessage = rawResponse.message || rawResponse.output || rawResponse.text || JSON.stringify(rawResponse);
      aiMetadata = rawResponse.metadata || {};
    } else {
      // Fallback for unexpected formats
      aiMessage = String(rawResponse);
    }
    
    // Store AI response message
    const assistantMessageId = generateMessageId();
    const assistantNow = new Date().toISOString();
    
    await c.env.DB
      .prepare(`
        INSERT INTO messages (
          id, conversation_id, role, content, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        assistantMessageId,
        conversationId,
        'assistant',
        aiMessage,
        JSON.stringify(aiMetadata),
        assistantNow
      )
      .run();
    
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      conversation_id: conversationId,
      role: 'assistant',
      content: aiMessage,
      metadata: aiMetadata,
      created_at: assistantNow
    };
    
    return c.json<SendMessageResponse>({ 
      success: true, 
      user_message: userMessage,
      assistant_message: assistantMessage,
      latency 
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    return c.json<SendMessageResponse>({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    }, 500);
  }
});

// Update conversation (title, metadata)
app.put('/conversations/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const conversationId = c.req.param('id');
  const body = await c.req.json<UpdateConversationRequest>();
  
  try {
    // Check ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
      .bind(conversationId, userId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Conversation not found or unauthorized' }, 404);
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    
    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
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
    
    values.push(conversationId);
    
    await c.env.DB
      .prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
    
    // Return updated conversation
    const conversation = await c.env.DB
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .bind(conversationId)
      .first();
    
    return c.json({ success: true, conversation });
  } catch (error) {
    console.error('Failed to update conversation:', error);
    return c.json({ success: false, error: 'Failed to update conversation' }, 500);
  }
});

// Delete conversation
app.delete('/conversations/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const conversationId = c.req.param('id');
  
  try {
    // Check ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
      .bind(conversationId, userId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Conversation not found or unauthorized' }, 404);
    }
    
    // Delete conversation (cascade will delete messages via trigger)
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

export default app;