import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB default for AutoRAG

// List files
app.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const files = await c.env.DB
    .prepare('SELECT * FROM files WHERE uploaded_by = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();
  
  // For now, we'll use direct download URLs
  // R2 signed URLs require additional configuration
  const filesWithUrls = (files.results || []).map((file: any) => ({
    ...file,
    url: `/api/files/${file.id}/download`
  }));
  
  return c.json({ success: true, files: filesWithUrls });
});

// Upload files (supports multiple)
app.post('/upload', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  try {
    const formData = await c.req.formData();
    const uploadResults = [];
    
    // Process each file in the form data
    for (const [, value] of formData.entries()) {
      if (value instanceof File) {
        const file = value;
        
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          uploadResults.push({
            name: file.name,
            success: false,
            error: `File exceeds 4MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
          });
          continue;
        }
        
        // Generate unique R2 key
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const r2Key = `${userId}/${timestamp}-${random}-${safeName}`;
        
        try {
          // Upload to R2
          const arrayBuffer = await file.arrayBuffer();
          await c.env.STORAGE.put(r2Key, arrayBuffer, {
            httpMetadata: {
              contentType: file.type || 'application/octet-stream',
            },
            customMetadata: {
              uploadedBy: userId,
              originalName: file.name,
            }
          });
          
          // Save metadata to D1
          const fileId = crypto.randomUUID();
          await c.env.DB
            .prepare(`
              INSERT INTO files (id, name, size, mime_type, r2_key, uploaded_by)
              VALUES (?, ?, ?, ?, ?, ?)
            `)
            .bind(
              fileId,
              file.name,
              file.size,
              file.type || 'application/octet-stream',
              r2Key,
              userId
            )
            .run();
          
          uploadResults.push({
            id: fileId,
            name: file.name,
            size: file.size,
            success: true
          });
        } catch (error) {
          console.error('Upload error:', error);
          uploadResults.push({
            name: file.name,
            success: false,
            error: 'Upload failed'
          });
        }
      }
    }
    
    return c.json({ 
      success: true, 
      results: uploadResults,
      message: `Uploaded ${uploadResults.filter(r => r.success).length} of ${uploadResults.length} files`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ success: false, error: 'Upload failed' }, 500);
  }
});

// Download file
app.get('/:id/download', async (c) => {
  const fileId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  try {
    // Get file metadata
    const file = await c.env.DB
      .prepare('SELECT * FROM files WHERE id = ? AND uploaded_by = ?')
      .bind(fileId, userId)
      .first();
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    // Get file from R2
    const object = await c.env.STORAGE.get(file.r2_key as string);
    
    if (!object) {
      return c.json({ error: 'File not found in storage' }, 404);
    }
    
    // Stream the file
    const headers = new Headers();
    headers.set('Content-Type', file.mime_type as string);
    headers.set('Content-Disposition', `attachment; filename="${file.name}"`);
    
    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Download error:', error);
    return c.json({ error: 'Download failed' }, 500);
  }
});

// Get signed URL for file
app.get('/:id/url', async (c) => {
  const fileId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  try {
    // Get file metadata
    const file = await c.env.DB
      .prepare('SELECT * FROM files WHERE id = ? AND uploaded_by = ?')
      .bind(fileId, userId)
      .first();
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    // Return direct download URL
    const url = `/api/files/${fileId}/download`;
    
    return c.json({ success: true, url });
  } catch (error) {
    console.error('URL generation error:', error);
    return c.json({ error: 'Failed to generate URL' }, 500);
  }
});

// Delete file
app.delete('/:id', async (c) => {
  const fileId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  try {
    // Get file metadata
    const file = await c.env.DB
      .prepare('SELECT * FROM files WHERE id = ? AND uploaded_by = ?')
      .bind(fileId, userId)
      .first();
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    // Delete from R2
    await c.env.STORAGE.delete(file.r2_key as string);
    
    // Delete from database
    await c.env.DB
      .prepare('DELETE FROM files WHERE id = ?')
      .bind(fileId)
      .run();
    
    return c.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    return c.json({ error: 'Delete failed' }, 500);
  }
});

export default app;