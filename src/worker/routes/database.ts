import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// List tables
app.get('/tables', async (c) => {
  const tables = await c.env.DB
    .prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `)
    .all();
  
  return c.json({ success: true, tables: tables.results });
});

// Get table data
app.get('/tables/:name', async (c) => {
  const tableName = c.req.param('name');
  
  // TODO: Add pagination and filtering
  const data = await c.env.DB
    .prepare(`SELECT * FROM ${tableName} LIMIT 100`)
    .all();
  
  return c.json({ success: true, data: data.results });
});

export default app;