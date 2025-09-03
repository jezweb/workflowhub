import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Get public form (no auth required for public forms)
app.get('/forms/:id', async (c) => {
  const formId = c.req.param('id');
  
  // Get form if it's public
  const form = await c.env.DB
    .prepare(`
      SELECT * FROM forms 
      WHERE id = ? AND is_public = 1
    `)
    .bind(formId)
    .first();
  
  if (!form) {
    return c.json({ error: 'Form not found or not accessible' }, 404);
  }
  
  // Parse JSON fields
  const parsedForm = {
    ...form,
    fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    settings: typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings
  };
  
  return c.json({ success: true, form: parsedForm });
});

// Submit public form
app.post('/forms/:id/submit', async (c) => {
  const formId = c.req.param('id');
  const body = await c.req.json();
  
  // Check if form exists and is public
  const form = await c.env.DB
    .prepare(`
      SELECT * FROM forms 
      WHERE id = ? AND is_public = 1
    `)
    .bind(formId)
    .first();
  
  if (!form) {
    return c.json({ error: 'Form not found or not accessible' }, 404);
  }
  
  const submissionId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Create submission record with pending webhook status
  await c.env.DB
    .prepare(`
      INSERT INTO form_submissions (
        id, form_id, data, submitted_by, ip_address, webhook_status, created_at
      )
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `)
    .bind(
      submissionId,
      formId,
      JSON.stringify(body.data),
      null, // No user for public submissions
      c.req.header('CF-Connecting-IP') || null
    )
    .run();
  
  // Parse form settings
  const settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;
  
  // Execute webhook if configured
  if (settings?.webhookUrl) {
    try {
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
          submitted_by: null,
          ip_address: c.req.header('CF-Connecting-IP') || null,
        }
      };
      
      // Execute webhook (fire and forget for async behavior)
      const webhookPromise = fetch(settings.webhookUrl, {
        method: settings.webhookMethod || 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
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
                webhook_duration_ms = ?
            WHERE id = ?
          `)
          .bind(
            error.message || 'Webhook execution failed',
            duration,
            submissionId
          )
          .run();
      });
      
      // Don't wait for webhook to complete (async behavior)
      // But we can optionally wait for a short time to get immediate response
      const responseType = form.response_type || settings?.responseType || 'toast';
      
      if (responseType === 'page') {
        // For page response, wait for webhook to get redirect URL
        try {
          const webhookResponse = await Promise.race([
            webhookPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Webhook timeout')), 5000)
            )
          ]);
          
          if (webhookResponse && (webhookResponse as Response).ok) {
            const result: any = await (webhookResponse as Response).json().catch(() => ({}));
            if (result && result.redirectUrl) {
              return c.json({ 
                success: true, 
                id: submissionId,
                redirectUrl: result.redirectUrl 
              });
            }
          }
        } catch {
          // Timeout or error, continue with default response
        }
      }
    } catch (error) {
      console.error('Webhook execution error:', error);
      // Mark webhook as skipped if there's an error
      await c.env.DB
        .prepare(`
          UPDATE form_submissions 
          SET webhook_status = 'skipped' 
          WHERE id = ?
        `)
        .bind(submissionId)
        .run();
    }
  } else {
    // No webhook configured, mark as skipped
    await c.env.DB
      .prepare(`
        UPDATE form_submissions 
        SET webhook_status = 'skipped' 
        WHERE id = ?
      `)
      .bind(submissionId)
      .run();
  }
  
  // Check if we should create a notification for the form owner
  if (form.created_by) {
    const notificationId = crypto.randomUUID();
    await c.env.DB
      .prepare(`
        INSERT INTO notifications (
          id, user_id, type, title, message, data, created_at
        )
        VALUES (?, ?, 'form_submission', ?, ?, ?, datetime('now'))
      `)
      .bind(
        notificationId,
        form.created_by,
        'New Form Submission',
        `New submission for "${form.name}"`,
        JSON.stringify({
          form_id: formId,
          submission_id: submissionId
        })
      )
      .run();
  }
  
  return c.json({ 
    success: true, 
    id: submissionId,
    message: settings?.successMessage || 'Form submitted successfully'
  });
});

export default app;