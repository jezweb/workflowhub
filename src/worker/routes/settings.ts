import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Get settings
app.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const settings = await c.env.DB
    .prepare('SELECT key, value FROM settings WHERE user_id = ? OR user_id IS NULL')
    .bind(userId)
    .all();
  
  // Convert to key-value object
  const settingsObj: Record<string, any> = {};
  for (const setting of settings.results) {
    try {
      settingsObj[setting.key as string] = JSON.parse(setting.value as string);
    } catch {
      settingsObj[setting.key as string] = setting.value;
    }
  }
  
  return c.json({ success: true, settings: settingsObj });
});

// Update setting
app.put('/:key', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const key = c.req.param('key');
  const body = await c.req.json();
  
  const value = typeof body.value === 'string' ? body.value : JSON.stringify(body.value);
  
  await c.env.DB
    .prepare(`
      INSERT INTO settings (key, value, user_id, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `)
    .bind(key, value, userId)
    .run();
  
  return c.json({ success: true });
});

// Delete setting
app.delete('/:key', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const key = c.req.param('key');
  
  await c.env.DB
    .prepare('DELETE FROM settings WHERE key = ? AND user_id = ?')
    .bind(key, userId)
    .run();
  
  return c.json({ success: true });
});

export default app;