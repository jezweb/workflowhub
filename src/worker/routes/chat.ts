import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// List conversations
app.get('/conversations', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const conversations = await c.env.DB
    .prepare(`
      SELECT * FROM conversations 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
    `)
    .bind(userId)
    .all();
  
  return c.json({ success: true, conversations: conversations.results });
});

// Create conversation
app.post('/conversations', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  const conversationId = crypto.randomUUID();
  
  await c.env.DB
    .prepare(`
      INSERT INTO conversations (id, title, parent_id, user_id)
      VALUES (?, ?, ?, ?)
    `)
    .bind(conversationId, body.title, body.parent_id || null, userId)
    .run();
  
  return c.json({ success: true, id: conversationId });
});

// Get messages
app.get('/conversations/:id/messages', async (c) => {
  const conversationId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  // Verify ownership
  const conversation = await c.env.DB
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .bind(conversationId, userId)
    .first();
  
  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }
  
  const messages = await c.env.DB
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at')
    .bind(conversationId)
    .all();
  
  return c.json({ success: true, messages: messages.results });
});

// Send message
app.post('/conversations/:id/messages', async (c) => {
  const conversationId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  // Verify ownership
  const conversation = await c.env.DB
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .bind(conversationId, userId)
    .first();
  
  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }
  
  const messageId = crypto.randomUUID();
  
  await c.env.DB
    .prepare(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, ?, ?)
    `)
    .bind(messageId, conversationId, body.role || 'user', body.content)
    .run();
  
  // TODO: Call AI API and save response
  
  return c.json({ success: true, id: messageId });
});

export default app;