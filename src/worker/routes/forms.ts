import { Hono } from 'hono';
import type { Env } from '../types';
import { variableService } from '../services/variables';

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
      INSERT INTO forms (
        id, name, description, fields, settings, is_public, 
        response_type, r2_bucket, turnstile_enabled, turnstile_site_key, 
        embed_allowed, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      formId,
      body.name,
      body.description || null,
      JSON.stringify(body.fields),
      JSON.stringify(body.settings || {}),
      body.is_public ? 1 : 0,
      body.response_type || body.settings?.responseType || 'toast',
      body.r2_bucket || body.settings?.r2Bucket || null,
      body.turnstile_enabled || body.settings?.turnstileEnabled || 0,
      body.turnstile_site_key || body.settings?.turnstileSiteKey || null,
      body.embed_allowed !== false ? 1 : 0,
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
      SET name = ?, description = ?, fields = ?, settings = ?, is_public = ?, 
          response_type = ?, r2_bucket = ?, turnstile_enabled = ?, 
          turnstile_site_key = ?, embed_allowed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND created_by = ?
    `)
    .bind(
      body.name,
      body.description || null,
      JSON.stringify(body.fields),
      JSON.stringify(body.settings || {}),
      body.is_public ? 1 : 0,
      body.response_type || body.settings?.responseType || 'toast',
      body.r2_bucket || body.settings?.r2Bucket || null,
      body.turnstile_enabled || body.settings?.turnstileEnabled || 0,
      body.turnstile_site_key || body.settings?.turnstileSiteKey || null,
      body.embed_allowed !== false ? 1 : 0,
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

// Get form submissions
app.get('/:id/submissions', async (c) => {
  const formId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  // Check if user owns the form
  const form = await c.env.DB
    .prepare('SELECT * FROM forms WHERE id = ? AND created_by = ?')
    .bind(formId, userId)
    .first();
  
  if (!form) {
    return c.json({ error: 'Form not found or unauthorized' }, 404);
  }
  
  // Get submissions
  const submissions = await c.env.DB
    .prepare(`
      SELECT * FROM form_submissions 
      WHERE form_id = ? 
      ORDER BY created_at DESC
    `)
    .bind(formId)
    .all();
  
  // Parse JSON data for each submission
  const parsedSubmissions = submissions.results.map((sub: any) => ({
    ...sub,
    data: typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data,
    files: sub.files ? JSON.parse(sub.files) : []
  }));
  
  return c.json({ success: true, submissions: parsedSubmissions });
});

// Clone form
app.post('/:id/clone', async (c) => {
  const formId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  // Get original form
  const form = await c.env.DB
    .prepare('SELECT * FROM forms WHERE id = ? AND created_by = ?')
    .bind(formId, userId)
    .first();
  
  if (!form) {
    return c.json({ error: 'Form not found or unauthorized' }, 404);
  }
  
  const newFormId = crypto.randomUUID();
  
  // Create cloned form with new ID
  await c.env.DB
    .prepare(`
      INSERT INTO forms (
        id, name, description, fields, settings, is_public, 
        response_type, r2_bucket, turnstile_enabled, turnstile_site_key, 
        embed_allowed, created_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    .bind(
      newFormId,
      `${form.name} (Copy)`,
      form.description,
      form.fields,
      form.settings,
      0, // Make clone private by default
      form.response_type,
      form.r2_bucket,
      form.turnstile_enabled,
      form.turnstile_site_key,
      form.embed_allowed,
      userId
    )
    .run();
  
  return c.json({ success: true, id: newFormId });
});

// Export form as JSON
app.get('/:id/export', async (c) => {
  const formId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  const form = await c.env.DB
    .prepare('SELECT * FROM forms WHERE id = ? AND created_by = ?')
    .bind(formId, userId)
    .first();
  
  if (!form) {
    return c.json({ error: 'Form not found or unauthorized' }, 404);
  }
  
  // Parse JSON fields
  const fields = typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields;
  const settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;
  
  // Create export object
  const exportData = {
    version: '1.0',
    name: form.name,
    description: form.description,
    fields: fields,
    settings: {
      ...settings,
      responseType: form.response_type,
      r2Bucket: form.r2_bucket,
      turnstileEnabled: form.turnstile_enabled,
      embedAllowed: form.embed_allowed
    }
  };
  
  return c.json(exportData);
});

// Import form from JSON
app.post('/import', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  // Validate import data
  if (!body.name || !body.fields || !Array.isArray(body.fields)) {
    return c.json({ error: 'Invalid form data' }, 400);
  }
  
  const formId = crypto.randomUUID();
  const settings = body.settings || {};
  
  await c.env.DB
    .prepare(`
      INSERT INTO forms (
        id, name, description, fields, settings, is_public, 
        response_type, r2_bucket, turnstile_enabled, turnstile_site_key, 
        embed_allowed, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      formId,
      body.name,
      body.description || null,
      JSON.stringify(body.fields),
      JSON.stringify(settings),
      0, // Imported forms are private by default
      settings.responseType || 'toast',
      settings.r2Bucket || null,
      settings.turnstileEnabled ? 1 : 0,
      settings.turnstileSiteKey || null,
      settings.embedAllowed !== false ? 1 : 0,
      userId
    )
    .run();
  
  return c.json({ success: true, id: formId });
});

// Submit form (kept for authenticated submissions)
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
  const startTime = Date.now();
  
  await c.env.DB
    .prepare(`
      INSERT INTO form_submissions (id, form_id, data, submitted_by, ip_address, webhook_status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `)
    .bind(
      submissionId,
      formId,
      JSON.stringify(body.data),
      userId,
      c.req.header('CF-Connecting-IP') || null
    )
    .run();
  
  // Parse form settings
  const formSettings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;
  
  // Execute webhook if configured
  if (formSettings?.webhookUrl) {
    try {
      // Get current user's variables for substitution (or form creator's if different)
      const variableUserId = userId || (form.created_by as string);
      const variables = await variableService.getAllVariables({
        userId: variableUserId,
        db: c.env.DB
      });
      
      // Substitute variables in webhook URL
      const substitutedWebhookUrl = variableService.substituteVariables(
        formSettings.webhookUrl,
        variables
      );
      
      // Prepare webhook payload
      const webhookPayload = {
        form: {
          id: form.id,
          name: form.name,
        },
        submission: {
          id: submissionId,
          data: body.data,
          submitted_at: new Date().toISOString(),
          submitted_by: userId,
          ip_address: c.req.header('CF-Connecting-IP') || null,
        }
      };
      
      // Substitute variables in webhook payload
      const substitutedPayload = variableService.substituteInObject(webhookPayload, variables);
      
      // Execute webhook (fire and forget for async behavior)
      const webhookPromise = fetch(substitutedWebhookUrl, {
        method: formSettings.webhookMethod || 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(substitutedPayload),
      }).then(async (response) => {
        const duration = Date.now() - startTime;
        const responseText = await response.text();
        
        // Update submission with webhook response
        await c.env.DB
          .prepare(`
            UPDATE form_submissions 
            SET webhook_status = ?, 
                webhook_response = ?, 
                webhook_response_code = ?,
                webhook_executed_at = datetime('now'),
                webhook_duration_ms = ?
            WHERE id = ?
          `)
          .bind(
            response.ok ? 'success' : 'error',
            responseText.substring(0, 10000), // Limit response size
            response.status,
            duration,
            submissionId
          )
          .run();
          
        return response;
      }).catch(async (error) => {
        const duration = Date.now() - startTime;
        
        // Update submission with error
        await c.env.DB
          .prepare(`
            UPDATE form_submissions 
            SET webhook_status = 'error', 
                webhook_response = ?, 
                webhook_executed_at = datetime('now'),
                webhook_duration_ms = ?
            WHERE id = ?
          `)
          .bind(
            error.message || 'Webhook execution failed',
            duration,
            submissionId
          )
          .run();
          
        throw error;
      });
      
      // Don't wait for webhook completion
      c.executionCtx.waitUntil(webhookPromise);
    } catch (error) {
      console.error('Webhook setup error:', error);
      // Continue even if webhook setup fails
    }
  }
  
  return c.json({ success: true, id: submissionId });
});

export default app;