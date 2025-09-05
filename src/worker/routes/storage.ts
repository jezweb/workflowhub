import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types';
import { StorageFactory } from '../services/storage';

const app = new Hono<{ Bindings: Env }>();

// Validation schemas
const createBucketSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  provider: z.enum(['r2', 's3']),
  is_default: z.boolean().optional(),
  is_default_chat: z.boolean().optional(),
  is_default_forms: z.boolean().optional(),
  config: z.object({
    // R2 config
    bucket_name: z.string().optional(),
    use_binding: z.boolean().optional(),
    account_id: z.string().optional(),
    access_key_id: z.string().optional(),
    secret_access_key: z.string().optional(),
    
    // S3 config
    region: z.string().optional(),
    endpoint: z.string().optional(),
    force_path_style: z.boolean().optional(),
  }).refine(
    (_data) => {
      // Validate based on provider type
      return true; // Will add specific validation later
    },
    { message: 'Invalid configuration for provider' }
  ),
});

const updateBucketSchema = createBucketSchema.partial();

// List all storage buckets
app.get('/buckets', async (c) => {
  try {
    const buckets = await c.env.DB
      .prepare(`
        SELECT id, name, description, provider, 
               is_default, is_default_chat, is_default_forms,
               created_at, updated_at
        FROM storage_buckets 
        ORDER BY created_at DESC
      `)
      .all();

    return c.json({ success: true, buckets: buckets.results || [] });
  } catch (error) {
    console.error('Failed to list buckets:', error);
    return c.json({ success: false, error: 'Failed to list buckets' }, 500);
  }
});

// Get bucket details
app.get('/buckets/:id', async (c) => {
  const bucketId = c.req.param('id');
  
  try {
    const bucket = await c.env.DB
      .prepare('SELECT * FROM storage_buckets WHERE id = ?')
      .bind(bucketId)
      .first();

    if (!bucket) {
      return c.json({ success: false, error: 'Bucket not found' }, 404);
    }

    // Don't send sensitive config to frontend
    const { config_json, ...bucketInfo } = bucket as any;
    
    return c.json({ success: true, bucket: bucketInfo });
  } catch (error) {
    console.error('Failed to get bucket:', error);
    return c.json({ success: false, error: 'Failed to get bucket' }, 500);
  }
});

// Create new bucket
app.post('/buckets', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  try {
    const body = await c.req.json();
    const validated = createBucketSchema.parse(body);
    
    // Check if name is unique
    const existing = await c.env.DB
      .prepare('SELECT id FROM storage_buckets WHERE name = ?')
      .bind(validated.name)
      .first();
    
    if (existing) {
      return c.json({ success: false, error: 'Bucket name already exists' }, 400);
    }
    
    // If setting as default, unset other defaults
    if (validated.is_default) {
      await c.env.DB
        .prepare('UPDATE storage_buckets SET is_default = FALSE WHERE is_default = TRUE')
        .run();
    }
    if (validated.is_default_chat) {
      await c.env.DB
        .prepare('UPDATE storage_buckets SET is_default_chat = FALSE WHERE is_default_chat = TRUE')
        .run();
    }
    if (validated.is_default_forms) {
      await c.env.DB
        .prepare('UPDATE storage_buckets SET is_default_forms = FALSE WHERE is_default_forms = TRUE')
        .run();
    }
    
    const bucketId = crypto.randomUUID();
    const configJson = StorageFactory.encryptConfig(validated.config);
    
    await c.env.DB
      .prepare(`
        INSERT INTO storage_buckets (
          id, name, description, provider, 
          is_default, is_default_chat, is_default_forms,
          config_json, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        bucketId,
        validated.name,
        validated.description || null,
        validated.provider,
        validated.is_default || false,
        validated.is_default_chat || false,
        validated.is_default_forms || false,
        configJson,
        userId
      )
      .run();
    
    return c.json({ success: true, id: bucketId });
  } catch (error) {
    console.error('Failed to create bucket:', error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: 'Failed to create bucket' }, 500);
  }
});

// Update bucket
app.put('/buckets/:id', async (c) => {
  const bucketId = c.req.param('id');
  
  try {
    const body = await c.req.json();
    const validated = updateBucketSchema.parse(body);
    
    // Get existing bucket
    const existing = await c.env.DB
      .prepare('SELECT * FROM storage_buckets WHERE id = ?')
      .bind(bucketId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Bucket not found' }, 404);
    }
    
    // Check name uniqueness if changing
    if (validated.name && validated.name !== (existing as any).name) {
      const nameExists = await c.env.DB
        .prepare('SELECT id FROM storage_buckets WHERE name = ? AND id != ?')
        .bind(validated.name, bucketId)
        .first();
      
      if (nameExists) {
        return c.json({ success: false, error: 'Bucket name already exists' }, 400);
      }
    }
    
    // Handle default flags
    if (validated.is_default) {
      await c.env.DB
        .prepare('UPDATE storage_buckets SET is_default = FALSE WHERE is_default = TRUE AND id != ?')
        .bind(bucketId)
        .run();
    }
    if (validated.is_default_chat) {
      await c.env.DB
        .prepare('UPDATE storage_buckets SET is_default_chat = FALSE WHERE is_default_chat = TRUE AND id != ?')
        .bind(bucketId)
        .run();
    }
    if (validated.is_default_forms) {
      await c.env.DB
        .prepare('UPDATE storage_buckets SET is_default_forms = FALSE WHERE is_default_forms = TRUE AND id != ?')
        .bind(bucketId)
        .run();
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    
    if (validated.name !== undefined) {
      updates.push('name = ?');
      values.push(validated.name);
    }
    if (validated.description !== undefined) {
      updates.push('description = ?');
      values.push(validated.description);
    }
    if (validated.provider !== undefined) {
      updates.push('provider = ?');
      values.push(validated.provider);
    }
    if (validated.is_default !== undefined) {
      updates.push('is_default = ?');
      values.push(validated.is_default);
    }
    if (validated.is_default_chat !== undefined) {
      updates.push('is_default_chat = ?');
      values.push(validated.is_default_chat);
    }
    if (validated.is_default_forms !== undefined) {
      updates.push('is_default_forms = ?');
      values.push(validated.is_default_forms);
    }
    if (validated.config !== undefined) {
      updates.push('config_json = ?');
      values.push(StorageFactory.encryptConfig(validated.config));
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(bucketId);
    
    await c.env.DB
      .prepare(`UPDATE storage_buckets SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to update bucket:', error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: 'Failed to update bucket' }, 500);
  }
});

// Delete bucket
app.delete('/buckets/:id', async (c) => {
  const bucketId = c.req.param('id');
  
  try {
    // Don't allow deleting the default bucket
    if (bucketId === 'default-r2-bucket') {
      return c.json({ success: false, error: 'Cannot delete default bucket' }, 400);
    }
    
    // Check if bucket has files
    const fileCount = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM files WHERE bucket_id = ?')
      .bind(bucketId)
      .first();
    
    if ((fileCount as any).count > 0) {
      return c.json({ 
        success: false, 
        error: 'Cannot delete bucket with files. Delete all files first.' 
      }, 400);
    }
    
    // Delete bucket
    await c.env.DB
      .prepare('DELETE FROM storage_buckets WHERE id = ?')
      .bind(bucketId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete bucket:', error);
    return c.json({ success: false, error: 'Failed to delete bucket' }, 500);
  }
});

// Test bucket connection
app.post('/buckets/:id/test', async (c) => {
  const bucketId = c.req.param('id');
  
  try {
    const bucket = await StorageFactory.getBucket(c.env, bucketId);
    
    if (!bucket) {
      return c.json({ success: false, error: 'Bucket not found' }, 404);
    }
    
    const provider = StorageFactory.createProvider(bucket, c.env);
    const connected = await provider.testConnection();
    
    return c.json({ 
      success: connected,
      message: connected ? 'Connection successful' : 'Connection failed'
    });
  } catch (error: any) {
    console.error('Connection test failed:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Connection test failed'
    }, 500);
  }
});

// Get default buckets
app.get('/defaults', async (c) => {
  try {
    const defaults = await c.env.DB
      .prepare(`
        SELECT 
          MAX(CASE WHEN is_default = TRUE THEN id END) as general,
          MAX(CASE WHEN is_default_chat = TRUE THEN id END) as chat,
          MAX(CASE WHEN is_default_forms = TRUE THEN id END) as forms
        FROM storage_buckets
      `)
      .first();
    
    return c.json({ success: true, defaults });
  } catch (error) {
    console.error('Failed to get defaults:', error);
    return c.json({ success: false, error: 'Failed to get defaults' }, 500);
  }
});

export default app;