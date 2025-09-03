import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Get all forms
app.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const forms = await c.env.DB
    .prepare(`
      SELECT * FROM forms 
      WHERE created_by = ? OR is_public = 1
      ORDER BY created_at DESC
    `)
    .bind(userId)
    .all();
  
  // Parse JSON fields for each form
  const parsedForms = forms.results.map((form: any) => ({
    ...form,
    fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    settings: typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings
  }));
  
  return c.json({ success: true, forms: parsedForms });
});

// Get single form
app.get('/:id', async (c) => {
  const formId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  const form = await c.env.DB
    .prepare(`
      SELECT * FROM forms 
      WHERE id = ? AND (created_by = ? OR is_public = 1)
    `)
    .bind(formId, userId)
    .first();
  
  if (!form) {
    return c.json({ error: 'Form not found' }, 404);
  }
  
  // Parse JSON fields
  const parsedForm = {
    ...form,
    fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    settings: typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings
  };
  
  return c.json({ success: true, form: parsedForm });
});

// Create form
app.post('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  const formId = crypto.randomUUID();
  
  await c.env.DB
    .prepare(`
      INSERT INTO forms (id, name, description, fields, settings, is_public, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      formId,
      body.name,
      body.description || null,
      JSON.stringify(body.fields),
      JSON.stringify(body.settings || {}),
      body.is_public ? 1 : 0,
      userId
    )
    .run();
  
  return c.json({ success: true, id: formId });
});

// Update form
app.put('/:id', async (c) => {
  const formId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  const result = await c.env.DB
    .prepare(`
      UPDATE forms 
      SET name = ?, description = ?, fields = ?, settings = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND created_by = ?
    `)
    .bind(
      body.name,
      body.description || null,
      JSON.stringify(body.fields),
      JSON.stringify(body.settings || {}),
      body.is_public ? 1 : 0,
      formId,
      userId
    )
    .run();
  
  if (result.meta.changes === 0) {
    return c.json({ error: 'Form not found or unauthorized' }, 404);
  }
  
  return c.json({ success: true });
});

// Delete form
app.delete('/:id', async (c) => {
  const formId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  const result = await c.env.DB
    .prepare('DELETE FROM forms WHERE id = ? AND created_by = ?')
    .bind(formId, userId)
    .run();
  
  if (result.meta.changes === 0) {
    return c.json({ error: 'Form not found or unauthorized' }, 404);
  }
  
  return c.json({ success: true });
});

// Submit form
app.post('/:id/submit', async (c) => {
  const formId = c.req.param('id');
  const body = await c.req.json();
  const userId = c.get('jwtPayload')?.sub || null;
  
  // Check if form exists and is accessible
  const form = await c.env.DB
    .prepare(`
      SELECT * FROM forms 
      WHERE id = ? AND (is_public = 1 OR created_by = ?)
    `)
    .bind(formId, userId)
    .first();
  
  if (!form) {
    return c.json({ error: 'Form not found' }, 404);
  }
  
  const submissionId = crypto.randomUUID();
  
  await c.env.DB
    .prepare(`
      INSERT INTO form_submissions (id, form_id, data, submitted_by, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      submissionId,
      formId,
      JSON.stringify(body.data),
      userId,
      c.req.header('CF-Connecting-IP') || null
    )
    .run();
  
  return c.json({ success: true, id: submissionId });
});

export default app;